<script setup lang="ts">
import { noteKey, type CatalogNote, type NoteSource } from '#shared/device-relay'
import { localUnitAddress } from '#shared/local-bridge'
import type { UnitNote } from '#shared/unit'
import { Select } from '@froq/ui'
const { t } = useI18n()

const props = defineProps<{ timelineIds?: string[] }>()
const emit = defineEmits<{ settings: [] }>()
const storage = useStorageDevice()
const entries = shallowRef<CatalogNote[]>([])
const sources = ref<NoteSource[]>([])
const warnings = ref<string[]>([])
const pending = ref(false)
const error = ref('')
const search = ref('')
const repo = ref('')
const source = ref('')
const sort = ref('updated')
const busy = ref(new Set<string>())
const creating = ref(false)
const targetRepo = ref('')
const targetKind = ref('pr')
const targetNumber = ref('')
const targetAnchor = ref(new Date().toISOString())
let generation = 0
const key = (entry: CatalogNote) => `${entry.unit}:${noteKey(entry.note)}`
const repositories = computed(() =>
  [...new Set(entries.value.map(entry => repository(entry.unit)))].sort(),
)
const repoOptions = computed(() => [
  { value: '', label: t('notes.allRepos') },
  ...repositories.value.map(name => ({ value: name, label: name })),
])
const sourceOptions = computed(() => [
  { value: '', label: t('notes.allSources') },
  ...sources.value.map(item => ({ value: item.id, label: item.label })),
])
const sortOptions = computed(() => [
  { value: 'updated', label: t('notes.updated') },
  { value: 'anchor', label: t('notes.anchor') },
])
const kindOptions = [
  { value: 'pr', label: 'PR' },
  { value: 'issue', label: 'Issue' },
]
const visible = computed(() => {
  const query = search.value.trim().toLowerCase()
  return entries.value
    .filter(
      entry =>
        (!repo.value || repository(entry.unit) === repo.value) &&
        (!source.value || entry.note.source === source.value) &&
        (!query || `${entry.unit}\n${entry.note.text}`.toLowerCase().includes(query)),
    )
    .toSorted(
      (a, b) =>
        Date.parse(sort.value === 'anchor' ? b.note.anchor : (b.note.updatedAt ?? b.note.at)) -
        Date.parse(sort.value === 'anchor' ? a.note.anchor : (a.note.updatedAt ?? a.note.at)),
    )
})
function repository(unit: string) {
  const address = localUnitAddress(unit)
  return `${address.owner}/${address.repo}`
}
function label(unit: string) {
  const address = localUnitAddress(unit)
  return `${address.kind === 'pr' ? 'PR' : 'Issue'} #${address.number}`
}
function url(unit: string) {
  const address = localUnitAddress(unit)
  return `https://github.com/${address.owner}/${address.repo}/${address.kind === 'pr' ? 'pull' : 'issues'}/${address.number}`
}
function sourceLabel(note: UnitNote) {
  return (
    sources.value.find(source => source.id === note.source)?.label ?? note.source ?? 'Global notes'
  )
}
async function reload() {
  if (!storage.connected.value) return
  const request = ++generation
  const session = storage.session.value
  pending.value = true
  error.value = ''
  try {
    const loaded: CatalogNote[] = []
    const messages = new Set<string>()
    let after: string | undefined
    const cursors = new Set<string>()
    do {
      const page = await storage.catalog(after)
      if (request !== generation || session !== storage.session.value) return
      loaded.push(
        ...page.entries.map(entry => ({
          ...entry,
          note: { ...entry.note, version: entry.version },
        })),
      )
      sources.value = page.sources
      for (const message of page.warnings) messages.add(message)
      after = page.next ?? undefined
      if (after && cursors.has(after)) throw new Error('Repeated catalog cursor')
      if (after) cursors.add(after)
      if (loaded.length > 10000) throw new Error('Too many notes')
    } while (after)
    const drafts = entries.value.filter(entry => entry.note.unsaved)
    entries.value = [
      ...loaded.filter(entry => !drafts.some(draft => key(draft) === key(entry))),
      ...drafts,
    ]
    warnings.value = [...messages]
  } catch {
    if (request === generation && session === storage.session.value) error.value = t('notes.failed')
  } finally {
    if (request === generation) pending.value = false
  }
}
function replace(entry: CatalogNote, note: UnitNote, version = entry.version) {
  entries.value = entries.value.map(row =>
    key(row) === key(entry) ? { ...entry, note, version } : row,
  )
}
async function save(entry: CatalogNote, payload: { text: string; version: string | null }) {
  if (!storage.connected.value || entry.note.writable === false || busy.value.has(key(entry)))
    return
  const session = storage.session.value
  const note = { ...entry.note, text: payload.text, version: payload.version, unsaved: true }
  replace(entry, note)
  busy.value = new Set([...busy.value, key(entry)])
  error.value = ''
  try {
    const saved = await storage.saveNote(entry.unit, note)
    if (session !== storage.session.value) return
    replace(entry, { ...saved, unsaved: false }, saved.version!)
  } catch (cause) {
    if (session !== storage.session.value) return
    if ((cause as { statusCode?: number }).statusCode === 409) {
      const draft = {
        ...note,
        id: crypto.randomUUID(),
        source: 'global',
        writable: true,
        version: null,
        unsaved: true,
      }
      entries.value = [
        ...entries.value.filter(row => key(row) !== key(entry)),
        { ...entry, note: draft, version: '' },
      ]
      await reload()
      error.value = t('notes.conflict')
    } else error.value = t('notes.saveFailed')
  } finally {
    const next = new Set(busy.value)
    next.delete(key(entry))
    busy.value = next
  }
}
async function remove(entry: CatalogNote) {
  if (!storage.connected.value || entry.note.writable === false || busy.value.has(key(entry)))
    return
  if (entry.note.version === null) {
    cancel(entry)
    return
  }
  const session = storage.session.value
  busy.value = new Set([...busy.value, key(entry)])
  try {
    await storage.deleteNote(
      entry.unit,
      entry.note.id,
      entry.note.version ?? entry.version,
      entry.note.source,
    )
    if (session === storage.session.value)
      entries.value = entries.value.filter(row => key(row) !== key(entry))
  } catch {
    if (session === storage.session.value) error.value = t('notes.deleteFailed')
  } finally {
    const next = new Set(busy.value)
    next.delete(key(entry))
    busy.value = next
  }
}
function cancel(entry: CatalogNote) {
  if (!entry.note.text && entry.note.version === null)
    entries.value = entries.value.filter(row => key(row) !== key(entry))
}
function copyGlobal(entry: CatalogNote) {
  const note = {
    ...entry.note,
    id: crypto.randomUUID(),
    source: 'global',
    writable: true,
    version: null,
    unsaved: true,
    at: new Date().toISOString(),
  }
  entries.value = [{ unit: entry.unit, note, version: '' }, ...entries.value]
  source.value = ''
}
function create() {
  try {
    const unit = `${targetKind.value}:${targetRepo.value.trim()}#${targetNumber.value}`
    localUnitAddress(unit)
    const anchor = new Date(targetAnchor.value).toISOString()
    const note = {
      id: crypto.randomUUID(),
      source: 'global',
      writable: true,
      text: '',
      anchor,
      at: new Date().toISOString(),
      version: null,
      unsaved: true,
    }
    entries.value = [{ unit, note, version: '' }, ...entries.value]
    creating.value = false
    repo.value = ''
    source.value = ''
    search.value = ''
    error.value = ''
  } catch {
    error.value = 'Enter owner/repo, a positive PR or issue number, and a valid ISO timestamp.'
  }
}
watch(storage.session, () => {
  generation++
  entries.value = []
  sources.value = []
  warnings.value = []
  busy.value = new Set()
  pending.value = false
  error.value = ''
})
watch(
  [storage.connected, storage.session, storage.revision],
  () => {
    if (storage.connected.value) void reload()
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  generation++
})
</script>

<template>
  <section
    class="notes-view"
    :aria-label="t('notes.title')"
  >
    <header class="notes-heading">
      <div>
        <h1>{{ t('notes.title') }}</h1>
        <p>{{ t('notes.description') }}</p>
      </div>
      <div class="actions">
        <AppButton
          variant="link"
          :disabled="!storage.connected.value || pending"
          @click="reload"
        >
          {{ t('notes.reload') }}
        </AppButton>
        <AppButton
          variant="link"
          :disabled="!storage.connected.value"
          @click="creating = !creating"
        >
          {{ t('notes.new') }}
        </AppButton>
      </div>
    </header>
    <p
      v-if="!storage.connected.value"
      class="notice"
    >
      {{ t('notes.unavailable') }}
      <AppButton
        variant="link"
        @click="emit('settings')"
        >{{ t('notes.settings') }}</AppButton
      >
    </p>
    <form
      v-if="creating"
      class="new-note"
      @submit.prevent="create"
    >
      <label
        >{{ t('notes.repo')
        }}<input
          v-model="targetRepo"
          placeholder="owner/repo"
          required
      /></label>
      <label>
        {{ t('notes.kind') }}
        <Select
          v-model="targetKind"
          :label="t('notes.kind')"
          :options="kindOptions"
          hide-label
          framed
        />
      </label>
      <label
        >{{ t('notes.number')
        }}<input
          v-model="targetNumber"
          type="number"
          min="1"
          max="9999999999"
          required
      /></label>
      <label
        >{{ t('notes.anchor')
        }}<input
          v-model="targetAnchor"
          required
      /></label>
      <div class="actions">
        <AppButton
          variant="link"
          type="submit"
          :disabled="!storage.connected.value"
          >{{ t('notes.create') }}</AppButton
        >
        <AppButton
          variant="link"
          @click="creating = false"
          >{{ t('notes.cancel') }}</AppButton
        >
      </div>
    </form>
    <div class="filters">
      <input
        v-model="search"
        class="search"
        type="search"
        :aria-label="t('notes.search')"
        :placeholder="t('notes.search')"
      />
      <Select
        v-model="repo"
        :label="t('notes.allRepos')"
        :options="repoOptions"
        hide-label
        framed
      />
      <Select
        v-model="source"
        :label="t('notes.allSources')"
        :options="sourceOptions"
        hide-label
        framed
      />
      <Select
        v-model="sort"
        :label="t('notes.sort')"
        :options="sortOptions"
        hide-label
        framed
      />
    </div>
    <p
      v-if="error"
      class="error"
      role="alert"
      >{{ error }}</p
    >
    <details
      v-if="warnings.length"
      class="notice"
      ><summary>{{ warnings.length }} source warnings</summary
      ><ul
        ><li
          v-for="warning in warnings"
          :key="warning"
          >{{ warning }}</li
        ></ul
      ></details
    >
    <p
      v-if="pending"
      class="notice"
      role="status"
      >{{ t('loading') }}</p
    >
    <EmptyState
      v-else-if="storage.connected.value && !visible.length"
      :text="t('notes.empty')"
    />
    <article
      v-for="entry in visible"
      :key="key(entry)"
      class="note-entry"
    >
      <header class="entry-heading">
        <span>{{ repository(entry.unit) }}</span>
        <SheetLink :url="url(entry.unit)">{{ label(entry.unit) }}</SheetLink>
        <NuxtLink
          v-if="props.timelineIds?.includes(entry.unit)"
          class="entry-timeline"
          :to="{ path: '/', query: { open: entry.unit } }"
          >{{ t('notes.timeline') }}</NuxtLink
        >
      </header>
      <p class="source"
        >{{ sourceLabel(entry.note) }}
        <span v-if="entry.note.writable === false">· {{ t('notes.readonly') }}</span></p
      >
      <NoteCard
        :note="entry.note"
        :editable="
          storage.connected.value && entry.note.writable !== false && !busy.has(key(entry))
        "
        @save="save(entry, $event)"
        @remove="remove(entry)"
        @cancel="cancel(entry)"
      />
      <AppButton
        v-if="entry.note.writable === false"
        variant="link"
        :disabled="!storage.connected.value"
        @click="copyGlobal(entry)"
        >{{ t('notes.copyGlobal') }}</AppButton
      >
      <AppButton
        v-else-if="entry.note.unsaved && entry.note.text"
        variant="link"
        :disabled="!storage.connected.value || busy.has(key(entry))"
        @click="save(entry, { text: entry.note.text, version: entry.note.version ?? null })"
        >{{ t('notes.saveDraft') }}</AppButton
      >
    </article>
  </section>
</template>

<style scoped>
.notes-view {
  padding: 8px 0 32px;
}

.notes-heading,
.entry-heading,
.actions,
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.notes-heading {
  justify-content: space-between;
  margin-bottom: 22px;
}

h1 {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.notes-heading p,
.notice,
.source {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}

.notes-heading p {
  margin-top: 8px;
}

.entry-timeline {
  border-bottom: 1px solid color-mix(in oklab, var(--fg) 28%, transparent);
  color: var(--fg);
  font-family: var(--font-meta);
  font-size: 12px;
  text-decoration: none;
}

.entry-timeline:hover {
  border-bottom-color: var(--fg);
}

input {
  min-width: 0;
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: var(--ui-radius);
  background: transparent;
  color: var(--fg);
  font: inherit;
  font-size: 13px;
  transition: border-color var(--dur-1) var(--ease);
}

input:hover {
  border-color: color-mix(in oklab, var(--fg) 28%, transparent);
}

input:focus-visible {
  border-color: var(--accent);
  outline: 1px solid var(--accent);
  outline-offset: 2px;
}

.filters {
  gap: 8px 20px;
  margin: 20px 0 4px;
}

.search {
  flex: 1 1 12rem;
  min-width: min(100%, 11rem);
}

.new-note {
  display: grid;
  gap: 12px;
  margin-bottom: 8px;
  padding: 14px 0 4px;
  border-top: 1px solid var(--line);
}

.new-note label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 12px;
}

.note-entry {
  padding: 18px 0;
  border-top: 1px solid var(--line);
}

.entry-heading {
  gap: 10px;
  font-family: var(--font-meta);
  font-size: 12px;
}

.source {
  margin-top: 7px;
  overflow-wrap: anywhere;
}

.error {
  margin: 12px 0;
  color: var(--accent);
  font-size: 13px;
}

.notice {
  margin: 12px 0;
}

.notice ul {
  padding-left: 20px;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  h1 {
    font-size: 28px;
  }
}
</style>

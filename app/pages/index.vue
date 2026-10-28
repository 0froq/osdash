<script setup lang="ts">
import { compareWaitingUnits, type UnitCategory, type UnitView } from '#shared/unit'
import { copy } from '~/copy/en'
import { placeUnit, type InboxSection } from '~/composables/useInbox'
import type { InboxViewName } from '~/components/inbox/Sidebar.vue'

const inbox = useInbox()
const media = useMedia()
const prefs = usePrefs(inbox.updateUnit)
const localBridge = useLocalBridge()
const storage = useStorageDevice()
const noteDisabledReason = computed(() =>
  storage.device.value
    ? storage.connected.value
      ? copy.note.loadingLocal
      : copy.note.storageOffline
    : copy.note.requiresLocal,
)
const route = useRoute()
const router = useRouter()

const categories: UnitCategory[] = ['claimed-fix', 'direct-pr', 'reported', 'helped']
const repo = ref<string[]>([])
const menu = ref<{ unit: UnitView; x: number; y: number } | null>(null)
const settingsOpen = ref(false)

const view = computed<InboxViewName>(() => {
  const value = route.query.view
  if (value === 'ended') return value
  return 'home'
})

const category = computed<UnitCategory | null>(() => {
  const value = route.query.cat
  if (
    value === 'claimed-fix' ||
    value === 'direct-pr' ||
    value === 'reported' ||
    value === 'helped'
  )
    return value
  return null
})

function placed(unit: UnitView): InboxSection | 'hidden' {
  return placeUnit(unit, inbox.nowMs.value)
}

function onHome(unit: UnitView): boolean {
  const section = placed(unit)
  return section === 'mine' || section === 'waiting' || section === 'ended'
}

const categoryCounts = computed(() => {
  const totals: Record<UnitCategory, number> = {
    'claimed-fix': 0,
    'direct-pr': 0,
    'reported': 0,
    'helped': 0,
  }
  for (const unit of inbox.units.value) {
    if (!onHome(unit)) continue
    totals[unit.category] += 1
  }
  return totals
})

const homeCount = computed(() => inbox.units.value.filter(unit => placed(unit) === 'mine').length)
const endedCount = computed(() => inbox.units.value.filter(unit => placed(unit) === 'ended').length)

function inView(unit: UnitView): boolean {
  if (view.value === 'ended') return placed(unit) === 'ended'
  return onHome(unit)
}

const pool = computed(() =>
  inbox.units.value.filter(
    unit => inView(unit) && (!category.value || unit.category === category.value),
  ),
)

const repoChips = computed(() => {
  const totals = new Map<string, number>()
  for (const unit of pool.value) totals.set(unit.repo, (totals.get(unit.repo) ?? 0) + 1)
  return [...totals.entries()]
    .sort((first, second) => first[0].localeCompare(second[0]))
    .map(([name, count]) => ({ name, count }))
})

const visible = computed(() => {
  const rows = pool.value.filter(unit => repo.value.length === 0 || repo.value.includes(unit.repo))
  rows.sort((first, second) => second.ageMs - first.ageMs)
  return rows
})

function sectionRows(section: InboxSection): UnitView[] {
  const rows = visible.value.filter(unit => placed(unit) === section)
  if (section === 'waiting') return rows.sort(compareWaitingUnits)
  if (section === 'ended') {
    return rows.sort(
      (first, second) => Date.parse(second.closedAt ?? '') - Date.parse(first.closedAt ?? ''),
    )
  }
  return [...rows].sort((first, second) => second.ageMs - first.ageMs)
}

const showHome = computed(() => view.value === 'home')
const filtering = computed(() => category.value !== null || repo.value.length > 0)

function showSection(rows: UnitView[]): boolean {
  return !filtering.value || rows.length > 0
}

function writeQuery(patch: Record<string, string | undefined>): void {
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries(route.query)) {
    if (typeof value === 'string' && value.length > 0) next[key] = value
  }
  for (const [key, value] of Object.entries(patch)) {
    if (!value) delete next[key]
    else next[key] = value
  }
  void router.replace({ query: next })
}

function selectView(next: InboxViewName): void {
  repo.value = []
  menu.value = null
  writeQuery({ view: next === 'home' ? undefined : next, cat: undefined })
}

function selectCategory(next: UnitCategory): void {
  repo.value = []
  menu.value = null
  writeQuery({
    view: undefined,
    cat: category.value === next ? undefined : next,
  })
}

function selectRepo(names: string[]): void {
  repo.value = names
}

function openMenu(unit: UnitView, event: MouseEvent): void {
  event.preventDefault()
  menu.value = { unit, x: event.clientX, y: event.clientY }
}

function markRead(unit: UnitView): void {
  menu.value = null
  seen.mark(unit)
}

function markLater(unit: UnitView, at: number): void {
  menu.value = null
  later.snooze(unit, at)
}

function queryRecord(): Record<string, string> {
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries(route.query)) {
    if (typeof value === 'string' && value.length > 0) next[key] = value
  }
  return next
}

const selectedId = ref('')
let pushedOpen = false
const seen = useSeen(inbox.updateUnit)
const later = useLater(inbox.updateUnit)
const openId = computed(() => (typeof route.query.open === 'string' ? route.query.open : ''))
const openUnit = computed(() => inbox.units.value.find(unit => unit.id === openId.value) ?? null)
watch(
  [() => openUnit.value?.id, storage.session, storage.connected, storage.revision],
  () => {
    if (openUnit.value) void prefs.loadNotes(openUnit.value)
  },
  { immediate: true },
)

const flat = computed(() => {
  if (!showHome.value) return visible.value
  return (['mine', 'waiting', 'ended'] as const).flatMap(section =>
    showSection(sectionRows(section)) ? sectionRows(section) : [],
  )
})

function selectUnit(unit: UnitView): void {
  selectedId.value = unit.id
  if (openId.value === unit.id) {
    seen.mark(unit)
    return
  }
  pushedOpen = true
  void router.push({ query: { ...queryRecord(), open: unit.id } })
}

function closePreview(): void {
  if (menu.value) {
    menu.value = null
    return
  }
  if (!openId.value) return
  if (pushedOpen) {
    pushedOpen = false
    void router.back()
    return
  }
  writeQuery({ open: undefined })
}

function moveTo(id: string): void {
  selectedId.value = id
  document.querySelector(`[data-unit="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest' })
}

function selectedUnit(): UnitView | undefined {
  return inbox.units.value.find(unit => unit.id === selectedId.value)
}

watch([openId, () => inbox.units.value], () => {
  const id = openId.value
  if (!id) return
  selectedId.value = id
  const unit = inbox.units.value.find(item => item.id === id)
  if (unit) seen.mark(unit)
})

useShortcuts({
  flat,
  selectedId,
  move: moveTo,
  open() {
    const unit = flat.value.find(item => item.id === selectedId.value) ?? flat.value[0]
    if (unit) selectUnit(unit)
  },
  close: closePreview,
  read() {
    const unit = selectedUnit()
    if (unit) seen.mark(unit)
  },
  home() {
    selectView('home')
  },
})

function addNote(unit: UnitView): void {
  prefs.addNote(unit)
}

function saveNote(
  unit: UnitView,
  payload: { id: string; text: string; version: string | null },
): void {
  const existing = prefs.notesOf(unit).find(note => note.id === payload.id)
  if (!existing) return
  void prefs.saveNote(unit, { ...existing, text: payload.text, version: payload.version })
}

function cancelNote(unit: UnitView, noteId: string): void {
  prefs.cancelNote(unit, noteId)
}

function moveNote(unit: UnitView, payload: { id: string; anchor: string }): void {
  void prefs.moveNote(unit, payload.id, payload.anchor)
}

function deleteNote(unit: UnitView, noteId: string): void {
  void prefs.deleteNote(unit, noteId)
}

const intro = ref(true)

watch(
  () => inbox.stats.value,
  stats => {
    if (stats) setTimeout(() => (intro.value = false), 1200)
  },
  { once: true },
)

watch(
  () => inbox.viewer.value?.login,
  (login, previous) => {
    if (previous && login !== previous) {
      settingsOpen.value = false
      void localBridge.reset()
    }
    storage.start(login ?? '')
  },
  { immediate: true },
)

function logout() {
  settingsOpen.value = false
  storage.reset()
  void localBridge.reset()
  void inbox.logout()
}

onBeforeUnmount(() => {
  storage.reset()
  void localBridge.reset()
})
onMounted(() => {
  void inbox.load(false)
})
</script>

<template>
  <InboxShell
    :mobile="media.isMobile.value"
    :data-intro="intro ? '1' : undefined"
  >
    <template #sidebar>
      <Sidebar
        v-if="inbox.viewer.value"
        :viewer="inbox.viewer.value"
        :pending="inbox.pending.value"
        :view="view"
        :category="category"
        :home-count="homeCount"
        :ended-count="endedCount"
        :category-counts="categoryCounts"
        @refresh="inbox.load(true)"
        @logout="logout"
        @settings="settingsOpen = true"
        @view="selectView"
        @category="selectCategory"
      />
      <MobileNav
        v-if="inbox.viewer.value"
        :viewer="inbox.viewer.value"
        :pending="inbox.pending.value"
        :view="view"
        :category="category"
        :home-count="homeCount"
        :ended-count="endedCount"
        :category-counts="categoryCounts"
        @refresh="inbox.load(true)"
        @logout="logout"
        @settings="settingsOpen = true"
        @view="selectView"
        @category="selectCategory"
      />
    </template>
    <p
      v-if="inbox.pending.value && !inbox.viewer.value"
      class="inbox-status"
      >{{ copy.loading }}</p
    >
    <p
      v-if="inbox.error.value"
      class="inbox-status error"
      role="alert"
    >
      {{ inbox.error.value }}
    </p>
    <template v-if="inbox.stats.value && inbox.viewer.value">
      <Greeting
        :name="inbox.displayName.value"
        :mine="homeCount"
        :merged="inbox.stats.value.merged"
        :open="inbox.stats.value.open"
        :average-first-reply-ms="inbox.stats.value.averageFirstReplyMs"
      />
      <p
        v-if="inbox.revalidating.value"
        class="inbox-status"
      >
        <span class="status-dot pulse" />
        {{ copy.updating }}
      </p>
      <p
        v-if="inbox.truncated.value"
        class="inbox-status"
        >{{ copy.truncated }}</p
      >
      <FilterChips
        :repos="repoChips"
        :active="repo"
        @select="selectRepo"
      />
      <EmptyState
        v-if="!inbox.pending.value && inbox.units.value.length === 0"
        :text="copy.emptyInbox"
      />
      <template v-else-if="showHome">
        <Section
          v-if="showSection(sectionRows('mine'))"
          :title="copy.sections.mine"
          :count="sectionRows('mine').length"
          layout="mine"
        >
          <UnitCard
            v-for="(unit, index) in sectionRows('mine')"
            :viewer="inbox.viewer.value.login"
            :key="unit.id"
            :index="index"
            :unit="unit"
            :selected="unit.id === selectedId"
            @select="selectUnit(unit)"
            @menu="openMenu(unit, $event)"
          />
        </Section>
        <Section
          v-if="showSection(sectionRows('waiting'))"
          :title="copy.sections.waiting"
          :count="sectionRows('waiting').length"
          layout="waiting"
        >
          <TransitionGroup name="waiting">
            <UnitCard
              v-for="(unit, index) in sectionRows('waiting')"
              :viewer="inbox.viewer.value.login"
              :key="unit.id"
              :index="index"
              :unit="unit"
              :selected="unit.id === selectedId"
              @select="selectUnit(unit)"
              @menu="openMenu(unit, $event)"
            />
          </TransitionGroup>
        </Section>
        <Section
          v-if="showSection(sectionRows('ended'))"
          :title="copy.sections.ended"
          :count="sectionRows('ended').length"
          layout="ended"
          collapsible
        >
          <UnitCard
            v-for="(unit, index) in sectionRows('ended')"
            :viewer="inbox.viewer.value.login"
            :key="unit.id"
            :index="index"
            :unit="unit"
            :selected="unit.id === selectedId"
            @select="selectUnit(unit)"
            @menu="openMenu(unit, $event)"
          />
        </Section>
      </template>
      <Section
        v-else
        :title="copy.sections.ended"
        :count="visible.length"
        layout="ended"
      >
        <UnitCard
          :viewer="inbox.viewer.value.login"
          v-for="(unit, index) in visible"
          :key="unit.id"
          :index="index"
          :unit="unit"
          :selected="unit.id === selectedId"
          @select="selectUnit(unit)"
          @menu="openMenu(unit, $event)"
        />
      </Section>
    </template>
    <CardMenu
      v-if="menu"
      :unit="menu.unit"
      :x="menu.x"
      :y="menu.y"
      @close="menu = null"
      @read="markRead(menu.unit)"
      @later="markLater(menu.unit, $event)"
    />
    <template #preview>
      <PreviewPanel
        :unit="openUnit"
        :viewer="inbox.viewer.value?.login ?? ''"
        :mobile="media.isMobile.value"
        :backdrop="media.isMobile.value || media.isOverlay.value"
        :notes="openUnit ? prefs.notesOf(openUnit) : []"
        :notes-editable="!!openUnit && prefs.canEditNotesFor(openUnit)"
        :editable-note-ids="openUnit ? prefs.editableNoteIds(openUnit) : []"
        :note-disabled-reason="noteDisabledReason"
        :note-error="prefs.noteError.value"
        @notes-reload="openUnit && prefs.loadNotes(openUnit)"
        @device-settings="settingsOpen = true"
        @close="closePreview"
        @note-add="openUnit && addNote(openUnit)"
        @note-save="openUnit && saveNote(openUnit, $event)"
        @note-move="openUnit && moveNote(openUnit, $event)"
        @note-delete="openUnit && deleteNote(openUnit, $event)"
        @note-cancel="openUnit && cancelNote(openUnit, $event)"
      />
    </template>
    <SettingsSheet
      v-model:open="settingsOpen"
      :viewer-login="inbox.viewer.value?.login ?? ''"
    />
  </InboxShell>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .waiting-move {
    transition:
      transform var(--dur-3) var(--ease),
      background-color var(--dur-1) var(--ease),
      border-color var(--dur-1) var(--ease);
  }
}

.inbox-status {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  color: var(--muted);
  font-size: 12.5px;
}

.inbox-status.error {
  color: var(--fg);
}

.inbox-status.error::before,
.status-dot {
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.inbox-status.error::before {
  content: '';
}

.status-dot {
  background: var(--muted);
}

.status-dot.pulse {
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.25;
  }
}

.inbox-status button {
  padding: 0;
  border: 0;
  color: var(--fg);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>

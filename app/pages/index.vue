<script setup lang="ts">
import { noteKey } from '#shared/device-relay'
import { compareWaitingUnits, type UnitCategory, type UnitView } from '#shared/unit'
import { Collapsible, Drawer } from '@froq/ui'
const { t } = useI18n()
import { placeUnit, type InboxSection } from '~/composables/useInbox'
import type { InboxViewName } from '~/components/inbox/Sidebar.vue'
import { categoryLabel } from '~/utils/category'

const inbox = useInbox()
const media = useMedia()
const prefs = usePrefs(inbox.updateUnit)
const localBridge = useLocalBridge()
const storage = useStorageDevice()
const { mock: mockMode } = useMockMode()
const navOpen = ref(false)
const noteMode = computed<'add' | 'loading' | 'connect' | 'refresh' | 'retry'>(() => {
  if (mockMode.value) return 'add'
  const unit = openUnit.value
  if (unit && prefs.canEditNotesFor(unit)) return 'add'
  if (!storage.device.value) return 'connect'
  if (!storage.connected.value) return 'refresh'
  if (!unit || prefs.notesPending(unit.id) || !prefs.noteError.value) return 'loading'
  return 'retry'
})

function refreshNoteAccess(): void {
  if (storage.device.value && !storage.connected.value) void storage.refresh()
  else if (openUnit.value) void prefs.loadNotes(openUnit.value)
}
const route = useRoute()
const router = useRouter()

const categories: UnitCategory[] = ['claimed-fix', 'direct-pr', 'reported', 'helped']
const repo = ref<string[]>([])
const showOwn = ref(false)
/** An ended unread card stays put until the preview leaves it. */
const held = ref<string | null>(null)
const mineOpen = ref(true)
const waitingOpen = ref(true)
const endedOpen = ref(false)
const ownKey = 'osdash-show-own'
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

/** Where the user is below home, shown in the header after the brand. */
const trail = computed<string[]>(() => {
  if (category.value) return [categoryLabel(t, category.value)]
  if (view.value === 'ended') return [t('sections.ended')]
  return []
})

function placed(unit: UnitView): InboxSection | 'hidden' {
  if (unit.ended && (unit.unread || unit.id === held.value)) return 'waiting'
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
    if (!listed(unit) || !onHome(unit)) continue
    totals[unit.category] += 1
  }
  return totals
})

function setShowOwn(shown: boolean): void {
  showOwn.value = shown
  localStorage.setItem(ownKey, shown ? '1' : '0')
}

function listed(unit: UnitView): boolean {
  if (showOwn.value) return true
  const login = inbox.viewer.value?.login
  if (!login) return true
  const owner = unit.repo.split('/')[0] ?? ''
  return owner.toLowerCase() !== login.toLowerCase()
}

const homeCount = computed(
  () => inbox.units.value.filter(unit => listed(unit) && placed(unit) === 'mine').length,
)

function inView(unit: UnitView): boolean {
  if (view.value === 'ended') return placed(unit) === 'ended'
  return onHome(unit)
}

const pool = computed(() =>
  inbox.units.value.filter(
    unit => listed(unit) && inView(unit) && (!category.value || unit.category === category.value),
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
  if (section === 'waiting') {
    return rows.sort((first, second) => {
      const rank = (unit: UnitView) => (unit.unread || unit.id === held.value ? 0 : 1)
      return rank(first) - rank(second) || compareWaitingUnits(first, second)
    })
  }
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
  writeQuery({ view: next === 'home' ? undefined : next, cat: undefined, open: undefined })
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

function unmarkLater(unit: UnitView): void {
  menu.value = null
  later.clear(unit.id)
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

/** Snoozed-until timestamp for a card's Later chip, or undefined when not snoozed. */
function laterUntil(id: string): number | undefined {
  return later.snoozed.value.get(id)
}
const openId = computed(() => (typeof route.query.open === 'string' ? route.query.open : ''))
const openUnit = computed(() => inbox.units.value.find(unit => unit.id === openId.value) ?? null)
watch(
  [() => openUnit.value?.id, storage.session, storage.connected, storage.revision],
  () => {
    if (openUnit.value) void prefs.loadNotes(openUnit.value)
  },
  { immediate: true },
)

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

watch([openId, () => inbox.units.value], () => {
  const id = openId.value
  if (!id) {
    held.value = null
    return
  }
  selectedId.value = id
  if (held.value && held.value !== id) held.value = null
  const unit = inbox.units.value.find(item => item.id === id)
  if (!unit) return
  if (unit.ended && unit.unread) held.value = unit.id
  seen.mark(unit)
})

function addNote(unit: UnitView): void {
  prefs.addNote(unit)
}

function saveNote(
  unit: UnitView,
  payload: { id: string; text: string; version: string | null },
): void {
  const existing = prefs.notesOf(unit).find(note => noteKey(note) === payload.id)
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
  showOwn.value = localStorage.getItem(ownKey) === '1'
  void inbox.load(false)
})
</script>

<template>
  <InboxShell
    :mobile="media.isMobile.value"
    :data-intro="intro ? '1' : undefined"
  >
    <template #header>
      <AppHeader
        :viewer="inbox.viewer.value"
        :pending="inbox.pending.value"
        :expanded="navOpen"
        :trail="trail"
        @home="selectView('home')"
        @toggle="navOpen = !navOpen"
        @refresh="inbox.load(true)"
        @logout="logout"
        @settings="settingsOpen = true"
      />
      <Drawer
        v-if="inbox.viewer.value"
        id="inbox-navigation"
        v-model="navOpen"
        side="left"
        :show-trigger="false"
        :aria-label="t('nav.section')"
        :close-label="t('nav.close')"
        close-on-scroll-outside
        style="width: min(16rem, calc(100vw - 24px))"
      >
        <Sidebar
          :view="view"
          :category="category"
          :home-count="homeCount"
          :category-counts="categoryCounts"
          @view="
            (next: InboxViewName) => {
              navOpen = false
              selectView(next)
            }
          "
          @category="
            (next: UnitCategory) => {
              navOpen = false
              selectCategory(next)
            }
          "
        />
      </Drawer>
    </template>
    <InboxSkeleton v-if="inbox.pending.value && !inbox.viewer.value" />
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
        {{ t('updating') }}
      </p>
      <p
        v-if="inbox.truncated.value"
        class="inbox-status"
        >{{ t('truncated') }}</p
      >
      <FilterChips
        :repos="repoChips"
        :active="repo"
        :show-own="showOwn"
        @select="selectRepo"
        @own="setShowOwn"
      />
      <EmptyState
        v-if="!inbox.pending.value && inbox.units.value.length === 0"
        :text="t('emptyInbox')"
      />
      <template v-else-if="showHome">
        <Collapsible
          v-if="showSection(sectionRows('mine'))"
          v-model="mineOpen"
          :label="`${t('sections.mine')} ${sectionRows('mine').length}`"
          class="section"
          data-layout="mine"
        >
          <div class="section-body">
            <UnitCard
              v-for="(unit, index) in sectionRows('mine')"
              :viewer="inbox.viewer.value.login"
              :key="unit.id"
              :index="index"
              :unit="unit"
              :selected="unit.id === selectedId"
              :later-at="laterUntil(unit.id)"
              @select="selectUnit(unit)"
              @menu="openMenu(unit, $event)"
            />
            <EmptyState
              v-if="sectionRows('mine').length === 0"
              :text="t('emptySection')"
            />
          </div>
        </Collapsible>
        <Collapsible
          v-if="showSection(sectionRows('waiting'))"
          v-model="waitingOpen"
          :label="`${t('sections.waiting')} ${sectionRows('waiting').length}`"
          class="section"
          data-layout="waiting"
        >
          <div class="section-body">
            <TransitionGroup name="waiting">
              <UnitCard
                v-for="(unit, index) in sectionRows('waiting')"
                :viewer="inbox.viewer.value.login"
                :key="unit.id"
                :index="index"
                :unit="unit"
                :selected="unit.id === selectedId"
                :later-at="laterUntil(unit.id)"
                @select="selectUnit(unit)"
                @menu="openMenu(unit, $event)"
              />
            </TransitionGroup>
            <EmptyState
              v-if="sectionRows('waiting').length === 0"
              :text="t('emptySection')"
            />
          </div>
        </Collapsible>
        <Collapsible
          v-if="showSection(sectionRows('ended'))"
          v-model="endedOpen"
          :label="`${t('sections.ended')} ${sectionRows('ended').length}`"
          class="section"
          data-layout="ended"
        >
          <div class="section-body">
            <UnitCard
              v-for="(unit, index) in sectionRows('ended')"
              :viewer="inbox.viewer.value.login"
              :key="unit.id"
              :index="index"
              :unit="unit"
              :selected="unit.id === selectedId"
              :later-at="laterUntil(unit.id)"
              @select="selectUnit(unit)"
              @menu="openMenu(unit, $event)"
            />
            <EmptyState
              v-if="sectionRows('ended').length === 0"
              :text="t('emptySection')"
            />
          </div>
        </Collapsible>
      </template>
    </template>
    <CardMenu
      v-if="menu"
      :unit="menu.unit"
      :x="menu.x"
      :y="menu.y"
      :later-at="laterUntil(menu.unit.id)"
      @close="menu = null"
      @read="markRead(menu.unit)"
      @later="markLater(menu.unit, $event)"
      @clear-later="unmarkLater(menu.unit)"
    />
    <template #preview>
      <PreviewPanel
        :unit="openUnit"
        :viewer="inbox.viewer.value?.login ?? ''"
        :loading="inbox.pending.value && !inbox.viewer.value"
        :mobile="media.isMobile.value"
        :backdrop="media.isMobile.value || media.isOverlay.value"
        :later-at="openUnit ? laterUntil(openUnit.id) : undefined"
        :notes="openUnit ? prefs.notesOf(openUnit) : []"
        :notes-editable="!!openUnit && prefs.canEditNotesFor(openUnit)"
        :editable-note-ids="openUnit ? prefs.editableNoteIds(openUnit) : []"
        :note-mode="noteMode"
        :note-error="prefs.noteError.value"
        @notes-reload="refreshNoteAccess"
        @device-settings="settingsOpen = true"
        @close="closePreview"
        @note-add="openUnit && addNote(openUnit)"
        @later="openUnit && markLater(openUnit, $event)"
        @clear-later="openUnit && unmarkLater(openUnit)"
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
.section {
  min-width: 0;
  margin-top: 30px;
}

/* The library pins an open section title at top: 0. The site header is sticky
   too, so pin it just below the header instead of behind it. The extra classes
   outrank the library's own selector. */
.section.ui-collapsible.is-open > :deep(.ui-collapsible-trigger) {
  top: var(--header-h);
}

.section-body {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 16px 0 4px;
}

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

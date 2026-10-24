<script setup lang="ts">
import type { UnitCategory, UnitView } from '#shared/unit'
import { copy } from '~/copy/en'
import { placeUnit, type InboxSection } from '~/composables/useInbox'
import type { InboxViewName } from '~/components/inbox/Sidebar.vue'
import { nextMondayMorning, threeDaysLater, tomorrowMorning } from '~/utils/later'

const inbox = useInbox()
const media = useMedia()
const prefs = usePrefs(inbox.updateUnit)
const route = useRoute()
const router = useRouter()

const categories: UnitCategory[] = ['claimed-fix', 'direct-pr', 'reported', 'helped']
const repo = ref('')
const menu = ref<{ unit: UnitView; x: number; y: number } | null>(null)
const settingsOpen = ref(false)

const view = computed<InboxViewName>(() => {
  const value = route.query.view
  if (value === 'later' || value === 'starred' || value === 'ended') return value
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
  return (
    section === 'mine' || section === 'activity' || section === 'waiting' || section === 'ended'
  )
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
const laterCount = computed(() => inbox.units.value.filter(unit => placed(unit) === 'later').length)
const endedCount = computed(() => inbox.units.value.filter(unit => placed(unit) === 'ended').length)
const starredCount = computed(() => inbox.units.value.filter(unit => unit.starred).length)

function inView(unit: UnitView): boolean {
  if (view.value === 'later') return placed(unit) === 'later'
  if (view.value === 'starred') return unit.starred
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
  const rows = pool.value.filter(unit => (repo.value ? unit.repo === repo.value : true))
  rows.sort((first, second) => second.ageMs - first.ageMs)
  return rows
})

function sectionRows(section: InboxSection): UnitView[] {
  const rows = visible.value.filter(unit => placed(unit) === section)
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
  repo.value = ''
  menu.value = null
  writeQuery({ view: next === 'home' ? undefined : next, cat: undefined })
}

function selectCategory(next: UnitCategory): void {
  repo.value = ''
  menu.value = null
  writeQuery({
    view: undefined,
    cat: category.value === next ? undefined : next,
  })
}

function selectRepo(name: string): void {
  repo.value = name
}

function openMenu(unit: UnitView, event: MouseEvent): void {
  event.preventDefault()
  menu.value = { unit, x: event.clientX, y: event.clientY }
}

function markRead(unit: UnitView): void {
  menu.value = null
  seen.mark(unit)
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
const openId = computed(() => (typeof route.query.open === 'string' ? route.query.open : ''))
const openUnit = computed(() => inbox.units.value.find(unit => unit.id === openId.value) ?? null)

const flat = computed(() => {
  if (!showHome.value) return visible.value
  return (['mine', 'activity', 'waiting', 'ended'] as const).flatMap(section =>
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
  star() {
    const unit = selectedUnit()
    if (unit) void prefs.setStar(unit, !unit.starred)
  },
  later() {
    const unit = selectedUnit()
    if (unit) void prefs.setLater(unit, tomorrowMorning())
  },
  read() {
    const unit = selectedUnit()
    if (unit) seen.mark(unit)
  },
  home() {
    selectView('home')
  },
})

function applyLater(unit: UnitView, preset: string | null): void {
  menu.value = null
  if (preset === null) {
    void prefs.setLater(unit, null)
    return
  }
  if (preset === 'tomorrow') {
    void prefs.setLater(unit, tomorrowMorning())
    return
  }
  if (preset === 'three-days') {
    void prefs.setLater(unit, threeDaysLater())
    return
  }
  if (preset === 'monday') {
    void prefs.setLater(unit, nextMondayMorning())
    return
  }
}

function toggleStar(unit: UnitView): void {
  menu.value = null
  void prefs.setStar(unit, !unit.starred)
}

const intro = ref(true)

watch(
  () => inbox.stats.value,
  stats => {
    if (stats) setTimeout(() => (intro.value = false), 1200)
  },
  { once: true },
)

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
        :later-count="laterCount"
        :starred-count="starredCount"
        :ended-count="endedCount"
        :category-counts="categoryCounts"
        @refresh="inbox.load(true)"
        @logout="inbox.logout()"
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
        :later-count="laterCount"
        :starred-count="starredCount"
        :ended-count="endedCount"
        :category-counts="categoryCounts"
        @refresh="inbox.load(true)"
        @logout="inbox.logout()"
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
            :key="unit.id"
            :index="index"
            :unit="unit"
            size="large"
            :selected="unit.id === selectedId"
            @select="selectUnit(unit)"
            @menu="openMenu(unit, $event)"
          />
        </Section>
        <Section
          v-if="showSection(sectionRows('activity'))"
          :title="copy.sections.activity"
          :count="sectionRows('activity').length"
          layout="activity"
        >
          <UnitCard
            v-for="(unit, index) in sectionRows('activity')"
            :key="unit.id"
            :index="index"
            :unit="unit"
            size="row"
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
          <UnitCard
            v-for="(unit, index) in sectionRows('waiting')"
            :key="unit.id"
            :index="index"
            :unit="unit"
            size="small"
            :selected="unit.id === selectedId"
            @select="selectUnit(unit)"
            @menu="openMenu(unit, $event)"
          />
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
            :key="unit.id"
            :index="index"
            :unit="unit"
            size="small"
            :selected="unit.id === selectedId"
            @select="selectUnit(unit)"
            @menu="openMenu(unit, $event)"
          />
        </Section>
      </template>
      <Section
        v-else-if="view === 'later'"
        :title="copy.nav.later"
        :count="visible.length"
        layout="mine"
        :empty="copy.emptyLater"
      >
        <UnitCard
          v-for="(unit, index) in visible"
          :key="unit.id"
          :index="index"
          :unit="unit"
          size="large"
          :selected="unit.id === selectedId"
          @select="selectUnit(unit)"
          @menu="openMenu(unit, $event)"
        />
      </Section>
      <Section
        v-else-if="view === 'starred'"
        :title="copy.nav.starred"
        :count="visible.length"
        layout="mine"
        :empty="copy.emptyStarred"
      >
        <UnitCard
          v-for="(unit, index) in visible"
          :key="unit.id"
          :index="index"
          :unit="unit"
          size="large"
          :selected="unit.id === selectedId"
          @select="selectUnit(unit)"
          @menu="openMenu(unit, $event)"
        />
      </Section>
      <Section
        v-else
        :title="copy.sections.ended"
        :count="visible.length"
        layout="ended"
      >
        <UnitCard
          v-for="(unit, index) in visible"
          :key="unit.id"
          :index="index"
          :unit="unit"
          size="small"
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
      @star="toggleStar(menu.unit)"
      @later="applyLater(menu.unit, $event)"
    />
    <template #preview>
      <PreviewPanel
        :unit="openUnit"
        :viewer="inbox.viewer.value?.login ?? ''"
        :mobile="media.isMobile.value"
        :backdrop="media.isMobile.value || media.isOverlay.value"
        @close="closePreview"
        @star="openUnit && toggleStar(openUnit)"
        @later="openUnit && applyLater(openUnit, $event)"
      />
    </template>
    <SettingsSheet v-model:open="settingsOpen" />
  </InboxShell>
</template>

<style scoped>
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

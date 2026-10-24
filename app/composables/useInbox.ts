import { RECENT_MS } from '#shared/turn'
import type { UnitCategory, UnitView } from '#shared/unit'
import { copy } from '~/copy/en'

export type InboxViewer = {
  login: string
  name: string | null
  avatarUrl: string | null
}

export type InboxCounts = {
  mine: number
  activity: number
  waiting: number
  ended: number
  later: number
  starred: number
  byCategory: Record<UnitCategory, number>
}

export type InboxStats = {
  merged: number
  open: number
  averageFirstReplyMs: number | null
}

type InboxPayload = {
  generatedAt: string
  cached: boolean
  revalidating?: boolean
  truncated: boolean
  mock: boolean
  viewer: InboxViewer
  counts: InboxCounts
  stats: InboxStats
  units: UnitView[]
}

export type InboxSection = 'mine' | 'activity' | 'waiting' | 'ended' | 'later'

export function placeUnit(unit: UnitView, nowMs: number): InboxSection | 'hidden' {
  if (unit.laterUntil !== null && Date.parse(unit.laterUntil) > nowMs) return 'later'
  if (unit.ended) {
    if (unit.closedAt && nowMs - Date.parse(unit.closedAt) <= RECENT_MS) return 'ended'
    return 'hidden'
  }
  if (unit.myTurn) return 'mine'
  if (unit.unread) return 'activity'
  return 'waiting'
}

function statusOf(caught: unknown): number | undefined {
  if (!caught || typeof caught !== 'object' || !('statusCode' in caught)) return undefined
  const code = (caught as { statusCode?: number }).statusCode
  return typeof code === 'number' ? code : undefined
}

function messageFor(status: number | undefined): string {
  if (status === 502) return copy.githubDown
  if (status === 403 || status === 429) return copy.rateLimited
  return copy.loadFailed
}

export function useInbox() {
  const { mock: mockMode } = useMockMode()
  const units = ref<UnitView[]>([])
  const counts = ref<InboxCounts | null>(null)
  const stats = ref<InboxStats | null>(null)
  const viewer = ref<InboxViewer | null>(null)
  const generatedAt = ref<string | null>(null)
  const cached = ref(false)
  const revalidating = ref(false)
  const truncated = ref(false)
  const mock = ref(false)
  const pending = ref(true)
  const error = ref('')
  const nowMs = ref(Date.now())
  let revalidateTimer: ReturnType<typeof setTimeout> | null = null

  function apply(body: InboxPayload): void {
    units.value = body.units
    counts.value = body.counts
    stats.value = body.stats
    viewer.value = body.viewer
    generatedAt.value = body.generatedAt
    cached.value = body.cached
    revalidating.value = body.revalidating === true
    truncated.value = body.truncated
    mock.value = body.mock
    nowMs.value = Date.now()
  }

  function section(name: InboxSection): UnitView[] {
    const rows = units.value.filter(unit => placeUnit(unit, nowMs.value) === name)
    if (name === 'ended') {
      return rows.sort(
        (first, second) => Date.parse(second.closedAt ?? '') - Date.parse(first.closedAt ?? ''),
      )
    }
    return [...rows].sort((first, second) => second.ageMs - first.ageMs)
  }

  const mine = computed(() => section('mine'))
  const activity = computed(() => section('activity'))
  const waiting = computed(() => section('waiting'))
  const ended = computed(() => section('ended'))
  const later = computed(() => section('later'))
  const displayName = computed(() => viewer.value?.name || viewer.value?.login || '')

  function scheduleRevalidatePoll(): void {
    if (revalidateTimer) clearTimeout(revalidateTimer)
    if (!revalidating.value) return
    revalidateTimer = setTimeout(() => {
      void load(false, true)
    }, 4000)
  }

  async function load(refresh = false, quiet = false): Promise<void> {
    if (!quiet) pending.value = true
    error.value = ''
    const params = new URLSearchParams()
    if (mockMode.value) params.set('mock', '1')
    if (refresh) params.set('refresh', '1')
    const query = params.size > 0 ? `?${params.toString()}` : ''
    try {
      const body = await $fetch<InboxPayload>(`/api/inbox${query}`)
      apply(body)
      scheduleRevalidatePoll()
    } catch (caught) {
      const status = statusOf(caught)
      if (status === 401 && !mockMode.value) {
        await navigateTo('/login')
        return
      }
      error.value = messageFor(status)
    } finally {
      if (!quiet) pending.value = false
    }
  }

  async function logout(): Promise<void> {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await navigateTo('/login')
  }

  function updateUnit(id: string, patch: Partial<UnitView>): void {
    const unit = units.value.find(item => item.id === id)
    if (!unit) return
    Object.assign(unit, patch)
  }

  onBeforeUnmount(() => {
    if (revalidateTimer) clearTimeout(revalidateTimer)
  })

  return {
    units,
    counts,
    stats,
    viewer,
    displayName,
    generatedAt,
    cached,
    revalidating,
    truncated,
    mock,
    pending,
    error,
    nowMs,
    mine,
    activity,
    waiting,
    ended,
    later,
    load,
    logout,
    apply,
    updateUnit,
  }
}

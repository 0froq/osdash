import { RECENT_MS } from '#shared/turn'
import { compareWaitingUnits, type UnitCategory, type UnitView } from '#shared/unit'

export type InboxViewer = {
  login: string
  name: string | null
  avatarUrl: string | null
}

export type InboxCounts = {
  mine: number
  waiting: number
  ended: number
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
  notificationsScope: boolean
  viewer: InboxViewer
  counts: InboxCounts
  stats: InboxStats
  units: UnitView[]
}

export type InboxSection = 'mine' | 'waiting' | 'ended'

export function placeUnit(unit: UnitView, nowMs: number): InboxSection | 'hidden' {
  if (unit.ended) {
    if (unit.closedAt && nowMs - Date.parse(unit.closedAt) <= RECENT_MS) return 'ended'
    return 'hidden'
  }
  // Unread is shown by the glyph, not by a section of its own: a card that
  // changed section the moment it was read would jump under the pointer.
  if (unit.myTurn) return 'mine'
  return 'waiting'
}

function statusOf(caught: unknown): number | undefined {
  if (!caught || typeof caught !== 'object' || !('statusCode' in caught)) return undefined
  const code = (caught as { statusCode?: number }).statusCode
  return typeof code === 'number' ? code : undefined
}

export function useInbox() {
  const { t } = useI18n()
  const { mock: mockMode } = useMockMode()
  function messageFor(status: number | undefined): string {
    if (status === 502) return t('githubDown')
    if (status === 403 || status === 429) return t('rateLimited')
    return t('loadFailed')
  }
  const units = ref<UnitView[]>([])
  const counts = ref<InboxCounts | null>(null)
  const stats = ref<InboxStats | null>(null)
  const viewer = ref<InboxViewer | null>(null)
  const generatedAt = ref<string | null>(null)
  const cached = ref(false)
  const revalidating = ref(false)
  const truncated = ref(false)
  const mock = ref(false)
  const notificationsScope = ref(true)
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
    notificationsScope.value = body.notificationsScope !== false
    nowMs.value = Date.now()
  }

  function section(name: InboxSection): UnitView[] {
    const rows = units.value.filter(unit => placeUnit(unit, nowMs.value) === name)
    if (name === 'waiting') return rows.sort(compareWaitingUnits)
    if (name === 'ended') {
      return rows.sort(
        (first, second) => Date.parse(second.closedAt ?? '') - Date.parse(first.closedAt ?? ''),
      )
    }
    return [...rows].sort((first, second) => second.ageMs - first.ageMs)
  }

  const mine = computed(() => section('mine'))
  const waiting = computed(() => section('waiting'))
  const ended = computed(() => section('ended'))
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
    notificationsScope,
    pending,
    error,
    nowMs,
    mine,
    waiting,
    ended,
    load,
    logout,
    apply,
    updateUnit,
  }
}

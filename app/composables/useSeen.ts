import { withMockQuery } from '#shared/mock-mode'
import type { UnitView } from '#shared/unit'

type UpdateUnit = (id: string, patch: Partial<UnitView>) => void

export function useSeen(updateUnit: UpdateUnit) {
  const { mock } = useMockMode()
  function seenUrl(): string {
    return withMockQuery('/api/seen', mock.value)
  }
  const queue = new Map<string, { ids: string[]; unread: boolean }>()
  let timer: ReturnType<typeof setTimeout> | null = null

  async function flush(): Promise<void> {
    if (timer) clearTimeout(timer)
    timer = null
    if (queue.size === 0) return
    const threadIds = [...queue.values()].flatMap(mark => mark.ids)
    const previous = new Map(queue)
    queue.clear()
    if (threadIds.length === 0) return
    try {
      await $fetch(seenUrl(), { method: 'POST', body: { threadIds } })
    } catch {
      for (const [id, mark] of previous)
        updateUnit(id, { unread: mark.unread, notificationThreadIds: mark.ids })
    }
  }

  function mark(unit: UnitView): void {
    if (!unit.unread && !queue.has(unit.id)) return
    queue.set(unit.id, { ids: unit.notificationThreadIds, unread: unit.unread })
    updateUnit(unit.id, { unread: false, notificationThreadIds: [] })
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      void flush()
    }, 800)
  }

  function flushBeacon(): void {
    if (queue.size === 0) return
    const threadIds = [...queue.values()].flatMap(mark => mark.ids)
    queue.clear()
    if (timer) clearTimeout(timer)
    timer = null
    if (threadIds.length === 0) return
    const body = new Blob([JSON.stringify({ threadIds })], { type: 'application/json' })
    navigator.sendBeacon(seenUrl(), body)
  }

  onMounted(() => {
    window.addEventListener('pagehide', flushBeacon)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pagehide', flushBeacon)
    void flush()
  })

  return { mark, flush }
}

import type { UnitView } from '#shared/unit'

type UpdateUnit = (id: string, patch: Partial<UnitView>) => void

function seenUrl(): string {
  return import.meta.dev ? '/api/seen?mock=1' : '/api/seen'
}

export function useSeen(updateUnit: UpdateUnit) {
  const queue = new Map<string, { at: string; unread: boolean }>()
  let timer: ReturnType<typeof setTimeout> | null = null

  async function flush(): Promise<void> {
    if (timer) clearTimeout(timer)
    timer = null
    if (queue.size === 0) return
    const items = [...queue.entries()].map(([id, mark]) => ({ id, at: mark.at }))
    const previous = new Map(queue)
    queue.clear()
    try {
      await $fetch(seenUrl(), { method: 'POST', body: { items } })
    } catch {
      for (const [id, mark] of previous) updateUnit(id, { unread: mark.unread })
    }
  }

  function mark(unit: UnitView, at = new Date().toISOString()): void {
    if (!unit.unread && !queue.has(unit.id)) return
    queue.set(unit.id, { at, unread: unit.unread })
    updateUnit(unit.id, { unread: false })
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      void flush()
    }, 800)
  }

  function flushBeacon(): void {
    if (queue.size === 0) return
    const items = [...queue.entries()].map(([id, mark]) => ({ id, at: mark.at }))
    queue.clear()
    if (timer) clearTimeout(timer)
    timer = null
    const body = new Blob([JSON.stringify({ items })], { type: 'application/json' })
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

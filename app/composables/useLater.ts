import type { UnitView } from '#shared/unit'

type UpdateUnit = (id: string, patch: Partial<UnitView>) => void

const KEY = 'osdash-later'

function read(): Record<string, number> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function write(value: Record<string, number>): void {
  localStorage.setItem(KEY, JSON.stringify(value))
}

export function useLater(updateUnit: UpdateUnit) {
  const due = ref(new Set<string>())
  let timer: ReturnType<typeof setTimeout> | null = null

  function schedule(): void {
    if (timer) clearTimeout(timer)
    const saved = read()
    const now = Date.now()
    let next = Infinity
    const ready = new Set<string>()
    for (const [id, at] of Object.entries(saved)) {
      if (at <= now) ready.add(id)
      else next = Math.min(next, at)
    }
    const previous = due.value
    due.value = ready
    for (const id of ready) if (!previous.has(id)) updateUnit(id, { unread: true })
    if (next < Infinity) timer = setTimeout(schedule, Math.min(next - now, 60_000))
  }

  function snooze(unit: UnitView, at: number): void {
    const saved = read()
    saved[unit.id] = at
    write(saved)
    due.value = new Set([...due.value].filter(id => id !== unit.id))
    schedule()
  }

  function clear(id: string): void {
    const saved = read()
    delete saved[id]
    write(saved)
    due.value = new Set([...due.value].filter(item => item !== id))
    updateUnit(id, { unread: true })
  }

  onMounted(schedule)
  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { due, snooze, clear }
}

export function laterAt(
  preset: 'hour' | 'tonight' | 'tomorrow' | 'week',
  now = new Date(),
): number {
  const at = new Date(now)
  if (preset === 'hour') return at.getTime() + 60 * 60 * 1000
  if (preset === 'week') {
    at.setDate(at.getDate() + 7)
    at.setHours(9, 0, 0, 0)
    return at.getTime()
  }
  at.setHours(preset === 'tonight' ? 20 : 9, 0, 0, 0)
  if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1)
  return at.getTime()
}

import type { UnitView } from '#shared/unit'

type ShortcutHandlers = {
  flat: ComputedRef<UnitView[]>
  selectedId: Ref<string>
  move: (id: string) => void
  open: () => void
  close: () => void
  star: () => void
  later: () => void
  read: () => void
  home: () => void
}

export function useShortcuts(handlers: ShortcutHandlers) {
  let armHome = false

  function onKey(event: KeyboardEvent): void {
    const target = event.target
    const typing = target instanceof HTMLElement && target.closest('input, textarea, select')
    if (typing) return
    if (event.key === 'Escape') {
      event.preventDefault()
      handlers.close()
      return
    }
    if (target instanceof HTMLElement && target.closest('button')) return
    if (event.key === 'g') {
      armHome = true
      return
    }
    if (armHome && event.key === 'h') {
      armHome = false
      event.preventDefault()
      handlers.home()
      return
    }
    armHome = false
    if (event.key === 'j' || event.key === 'k') {
      event.preventDefault()
      const rows = handlers.flat.value
      if (rows.length === 0) return
      const current = rows.findIndex(unit => unit.id === handlers.selectedId.value)
      const start = current === -1 ? (event.key === 'j' ? -1 : 0) : current
      const next = event.key === 'j' ? Math.min(rows.length - 1, start + 1) : Math.max(0, start - 1)
      const unit = rows[next]
      if (!unit) return
      handlers.move(unit.id)
      return
    }
    if (event.key === 'Enter' || event.key === 'o') {
      event.preventDefault()
      handlers.open()
      return
    }
    if (event.key === 's') {
      event.preventDefault()
      handlers.star()
      return
    }
    if (event.key === 'l') {
      event.preventDefault()
      handlers.later()
      return
    }
    if (event.key === 'e') {
      event.preventDefault()
      handlers.read()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
}

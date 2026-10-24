import { withMockQuery } from '#shared/mock-mode'
import type { UnitView } from '#shared/unit'

export function usePrefs(updateUnit: (id: string, patch: Partial<UnitView>) => void) {
  const { mock } = useMockMode()
  function endpoint(path: string): string {
    return withMockQuery(path, mock.value)
  }
  async function setStar(unit: UnitView, on: boolean): Promise<void> {
    const previous = unit.starred
    updateUnit(unit.id, { starred: on })
    try {
      await $fetch(endpoint('/api/prefs'), { method: 'PUT', body: { star: { id: unit.id, on } } })
    } catch {
      updateUnit(unit.id, { starred: previous })
    }
  }

  async function setLater(unit: UnitView, until: string | null): Promise<void> {
    const previous = unit.laterUntil
    updateUnit(unit.id, { laterUntil: until })
    try {
      await $fetch(endpoint('/api/prefs'), {
        method: 'PUT',
        body: { later: { id: unit.id, until } },
      })
    } catch {
      updateUnit(unit.id, { laterUntil: previous })
    }
  }

  return { setStar, setLater }
}

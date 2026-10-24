import type { Ref } from 'vue'
import type { NavigationItem } from './types'

/** Select on ordinary activation, retaining browser behavior for modified links. */
export function useNavigation(active: Ref<string>) {
  function isActive(item: NavigationItem): boolean {
    return active.value === item.value
  }

  function activate(event: MouseEvent, item: NavigationItem): void {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return
    if (!item.href)
      event.preventDefault()
    active.value = item.value
  }

  return { isActive, activate }
}

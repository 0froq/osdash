import type { MaybeRefOrGetter, Ref } from 'vue'
import { toValue } from 'vue'

/** Controlled disclosure state with no layout or DOM assumptions. */
export function useDisclosure(open: Ref<boolean>, disabled: MaybeRefOrGetter<boolean> = false) {
  function toggle(event?: Event): void {
    if (toValue(disabled) || event?.defaultPrevented)
      return
    open.value = !open.value
  }

  return { toggle }
}

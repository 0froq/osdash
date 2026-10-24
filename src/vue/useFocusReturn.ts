import type { MaybeRefOrGetter, Ref } from 'vue'
import { toValue } from 'vue'

/** Bind to a layer's cancelable open/close autofocus events; does not trap focus. */
export function useFocusReturn(open: Ref<boolean>, target: MaybeRefOrGetter<HTMLElement | null | undefined>, captureFallback: MaybeRefOrGetter<boolean> = true) {
  let previous: HTMLElement | null = null

  function capture(event: Event) {
    const element = event.target as HTMLElement | null
    const active = element?.ownerDocument?.activeElement
    previous = active && active !== element?.ownerDocument.body && typeof (active as HTMLElement).focus === 'function'
      ? active as HTMLElement
      : null
  }

  function available(element: HTMLElement | null | undefined): element is HTMLElement {
    return Boolean(element?.isConnected && !element.matches(':disabled') && !element.closest('[hidden], [inert]') && element.getClientRects().length)
  }

  function restore(event: Event) {
    if (event.defaultPrevented) {
      if (!open.value)
        previous = null
      return
    }
    // An old content instance may finish closing after the parent has reopened.
    if (open.value) {
      event.preventDefault()
      return
    }
    const explicit = toValue(target)
    const fallback = toValue(captureFallback)
    const captured = fallback ? previous : null
    const destination = available(explicit) ? explicit : available(captured) ? captured : null
    if (!destination && !fallback) {
      previous = null
      return // Let the layer restore its own trigger.
    }
    event.preventDefault()
    previous = null
    destination?.focus({ preventScroll: true })
  }

  return { capture, restore }
}

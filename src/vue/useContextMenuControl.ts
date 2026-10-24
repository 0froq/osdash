import type { MaybeRefOrGetter } from 'vue'
import { injectContextMenuRootContext } from 'reka-ui'
import { nextTick, ref, toValue, watch } from 'vue'

/** Call beneath ContextMenuRoot. Gate stale opening intents without rebuilding its target. */
export function useContextMenuControl(disabled: MaybeRefOrGetter<boolean> = false) {
  const context = injectContextMenuRootContext()
  const blocked = ref(toValue(disabled))
  let revision = 0

  function close() {
    revision++
    blocked.value = true
    context.onOpenChange(false)
  }

  // Re-arm only from a fresh context-menu gesture. Enabling alone must not revive
  // a queued long press; mouse pointerdown does not clear Reka's touch timer.
  async function prepare(event: Event) {
    if (event.defaultPrevented || toValue(disabled))
      return
    if (event.type !== 'contextmenu' && !(event.type === 'pointerdown' && ['touch', 'pen'].includes((event as PointerEvent).pointerType)))
      return
    const current = revision
    // Capture runs before descendants can prevent the gesture. Resume before
    // Reka's bubbling handler, but never undo a close requested in that gesture.
    await nextTick()
    if (!event.defaultPrevented && !toValue(disabled) && revision === current)
      blocked.value = false
  }

  watch(() => toValue(disabled), (value) => {
    if (value)
      close()
  }, { flush: 'sync' })
  // Boolean-only synchronous guard runs before content can mount/focus or the
  // upstream batched update event can report a rejected opening request.
  watch(context.open, (value) => {
    if (value && (toValue(disabled) || blocked.value))
      context.onOpenChange(false)
  }, { flush: 'sync' })

  return { close, prepare }
}

import type { MaybeRefOrGetter } from 'vue'
import { onMounted, onScopeDispose, toValue, watch } from 'vue'
import { createScrollGesture } from '../core/scroll'

export interface ScrollHandoffOptions {
  /** Evaluated on wheel input; may read a media query in client-only code. */
  enabled?: MaybeRefOrGetter<boolean>
  /** Pause between wheel events that starts a new gesture, in milliseconds. */
  idle?: number
}

/** Hand a fresh outward wheel gesture to ancestors without leaking an internal gesture. */
export function useScrollHandoff(target: MaybeRefOrGetter<HTMLElement | null | undefined>, options: ScrollHandoffOptions = {}) {
  let detach: (() => void) | undefined
  let stop: (() => void) | undefined

  onMounted(() => {
    stop = watch(() => toValue(target), (element) => {
      detach?.()
      detach = undefined
      if (!element)
        return

      const gesture = createScrollGesture(options.idle)
      const style = element.style
      const previous = style.getPropertyValue('overscroll-behavior-y')
      const priority = style.getPropertyPriority('overscroll-behavior-y')
      let timer: number | undefined

      function restore() {
        if (timer !== undefined)
          window.clearTimeout(timer)
        timer = undefined
        if (previous)
          style.setProperty('overscroll-behavior-y', previous, priority)
        else
          style.removeProperty('overscroll-behavior-y')
        gesture.reset()
      }

      function wheel(event: WheelEvent) {
        if ((options.enabled !== undefined && !toValue(options.enabled)) || event.ctrlKey || event.defaultPrevented) {
          restore()
          return
        }
        // Leave horizontal scrolling and zoom gestures to their native handlers.
        if (!event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY))
          return
        // Nested scroll areas retain their own gesture ownership.
        for (const node of event.composedPath()) {
          if (node === element)
            break
          if (node instanceof HTMLElement && node.scrollHeight > node.clientHeight + 1
            && /^(?:auto|scroll)$/.test(getComputedStyle(node).overflowY)) {
            return
          }
        }
        const owner = gesture.route(event.deltaY, event.timeStamp, {
          top: element!.scrollTop,
          height: element!.scrollHeight,
          viewport: element!.clientHeight,
        })
        // Native chaining preserves device acceleration, inertia and ancestor selection.
        style.setProperty('overscroll-behavior-y', owner === 'outer' ? 'auto' : 'contain')
        if (timer !== undefined)
          window.clearTimeout(timer)
        timer = window.setTimeout(restore, options.idle ?? 180)
      }

      // Choose containment before the browser performs the first wheel's default action.
      element.addEventListener('wheel', wheel, { passive: false })
      detach = () => {
        element.removeEventListener('wheel', wheel)
        if (timer !== undefined)
          window.clearTimeout(timer)
        restore()
      }
    }, { immediate: true, flush: 'post' })
  })

  onScopeDispose(() => {
    stop?.()
    detach?.()
  })
}

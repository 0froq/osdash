import type { MaybeRefOrGetter } from 'vue'
import { onMounted, onScopeDispose, toValue, watch } from 'vue'

/** Cancellable client-only timer; pausing retains remaining time, reopening resets it. */
export function useAutoDismiss(active: MaybeRefOrGetter<boolean>, options: {
  duration: MaybeRefOrGetter<number>
  paused?: MaybeRefOrGetter<boolean>
  onDismiss: () => void
}) {
  let timer: number | undefined
  let remaining = 0
  let startedAt = 0
  let mounted = false
  let disposed = false
  let enabled = false
  const paused = () => options.paused === undefined ? false : toValue(options.paused)

  function cancel() {
    if (timer !== undefined)
      window.clearTimeout(timer)
    timer = undefined
  }

  function start() {
    if (!mounted || disposed || !toValue(active) || paused() || !enabled)
      return
    startedAt = window.performance.now()
    // Browsers overflow larger delays; schedule in bounded chunks instead.
    timer = window.setTimeout(() => {
      timer = undefined
      remaining = Math.max(0, remaining - (window.performance.now() - startedAt))
      if (disposed || !toValue(active) || paused())
        return
      if (remaining > 0)
        start()
      else
        options.onDismiss()
    }, Math.min(remaining, 2_147_483_647))
  }

  watch([() => toValue(active), () => toValue(options.duration)], ([isActive, duration]) => {
    cancel()
    enabled = Number.isFinite(duration) && duration > 0
    remaining = enabled ? duration : 0
    if (isActive)
      start()
  }, { immediate: true, flush: 'sync' })

  watch(paused, (isPaused) => {
    if (isPaused) {
      if (timer !== undefined)
        remaining = Math.max(0, remaining - (window.performance.now() - startedAt))
      cancel()
    }
    else {
      start()
    }
  }, { flush: 'sync' })

  onMounted(() => {
    mounted = true
    start()
  })
  onScopeDispose(() => {
    disposed = true
    cancel()
  })
}

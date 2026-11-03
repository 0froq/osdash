import type { MaybeRefOrGetter } from 'vue'
import { onScopeDispose, readonly, ref, shallowRef, toValue } from 'vue'

export type ActionStatus = 'idle' | 'pending' | 'success' | 'error'
export type ActionResult = { ok: true } | { ok: false; error: Error }

/**
 * Run an action and track its outcome. `run` resolves when the action finishes;
 * `status` holds `pending` while it runs, `success`/`error` for `resetAfter`
 * milliseconds after it settles, then returns to `idle`.
 */
export function useAction(
  action: MaybeRefOrGetter<(() => unknown | Promise<unknown>) | undefined>,
  resetAfter: MaybeRefOrGetter<number> = 900,
) {
  const status = ref<ActionStatus>('idle')
  const error = shallowRef<Error>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  function scheduleReset(remaining: number): void {
    const startedAt = performance.now()
    timer = setTimeout(
      () => {
        timer = undefined
        if (disposed) return
        const next = Math.max(0, remaining - (performance.now() - startedAt))
        if (next > 0) scheduleReset(next)
        else reset()
      },
      Math.min(remaining, 2_147_483_647),
    )
  }

  function reset(): void {
    clearTimeout(timer)
    timer = undefined
    status.value = 'idle'
    error.value = undefined
  }

  async function run(): Promise<ActionResult | undefined> {
    const fn = toValue(action)
    if (disposed || !fn || status.value === 'pending') return
    reset()
    status.value = 'pending'
    let result: ActionResult
    try {
      await fn()
      result = { ok: true }
    } catch (cause) {
      result = { ok: false, error: cause instanceof Error ? cause : new Error(String(cause)) }
    }
    if (disposed) return
    status.value = result.ok ? 'success' : 'error'
    error.value = result.ok ? undefined : result.error
    const delay = toValue(resetAfter)
    if (Number.isFinite(delay) && delay > 0) scheduleReset(delay)
    return result
  }

  onScopeDispose(() => {
    disposed = true
    clearTimeout(timer)
  })

  return { status: readonly(status), error: readonly(error), run, reset }
}

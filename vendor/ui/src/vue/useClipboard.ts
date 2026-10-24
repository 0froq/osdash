import type { MaybeRefOrGetter } from 'vue'
import { onScopeDispose, readonly, ref, shallowRef, toValue } from 'vue'

export type ClipboardStatus = 'idle' | 'pending' | 'copied' | 'error'
export type ClipboardResult = { ok: true, text: string } | { ok: false, error: Error }

/** Text-only clipboard interaction. Call copy directly from a user gesture. */
export function useClipboard(text: MaybeRefOrGetter<string>, resetAfter: MaybeRefOrGetter<number> = 1600) {
  const status = ref<ClipboardStatus>('idle')
  const error = shallowRef<Error>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  function scheduleReset(remaining: number): void {
    const startedAt = performance.now()
    timer = setTimeout(() => {
      timer = undefined
      if (disposed)
        return
      const next = Math.max(0, remaining - (performance.now() - startedAt))
      if (next > 0)
        scheduleReset(next)
      else
        reset()
    }, Math.min(remaining, 2_147_483_647))
  }

  function reset(): void {
    clearTimeout(timer)
    timer = undefined
    status.value = 'idle'
    error.value = undefined
  }

  async function copy(): Promise<ClipboardResult | undefined> {
    if (disposed || status.value === 'pending')
      return
    reset()
    status.value = 'pending'
    let result: ClipboardResult
    try {
      const value = toValue(text)
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText)
        throw new Error('Clipboard writing is unavailable')
      await navigator.clipboard.writeText(value)
      result = { ok: true, text: value }
    }
    catch (cause) {
      result = { ok: false, error: cause instanceof Error ? cause : new Error(String(cause)) }
    }
    // An in-flight browser request cannot be cancelled; do not update a disposed scope.
    if (disposed)
      return
    status.value = result.ok ? 'copied' : 'error'
    error.value = result.ok ? undefined : result.error
    const delay = toValue(resetAfter)
    if (Number.isFinite(delay) && delay > 0)
      scheduleReset(delay)
    return result
  }

  onScopeDispose(() => {
    disposed = true
    clearTimeout(timer)
  })

  return { status: readonly(status), error: readonly(error), copy }
}

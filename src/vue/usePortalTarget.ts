import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

/** Keep teleported content in the consumer's token scope, without creating a new .ui. */
export function usePortalTarget(source: MaybeRefOrGetter<HTMLElement | null>) {
  return computed(() => toValue(source)?.closest<HTMLElement>('.ui') ?? undefined)
}

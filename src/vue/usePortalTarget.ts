import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

/**
 * Resolve where an overlay should teleport. Overlay content carries its own
 * `.ui` class, so `--ui-*` tokens are self-contained — the default resolves to
 * the document body so the popper positions against the viewport, not against a
 * (possibly transformed) `.ui` ancestor. Pass `portalTo` to nest elsewhere.
 */
export function usePortalTarget(source: MaybeRefOrGetter<HTMLElement | null>) {
  return computed(() => toValue(source)?.ownerDocument?.body ?? undefined)
}

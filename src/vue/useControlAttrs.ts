import { useAttrs } from 'vue'

/** Route native attributes to a wrapped control, retaining styling on its label. */
export function useControlAttrs() {
  const attrs = useAttrs()

  function wrapperAttrs() {
    return { class: attrs.class, style: attrs.style }
  }

  function controlAttrs() {
    // Read during render; useAttrs must not be cached in a computed getter.
    const { class: _class, style: _style, ...control } = attrs
    return control
  }

  return { wrapperAttrs, controlAttrs }
}

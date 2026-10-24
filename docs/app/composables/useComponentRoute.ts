/** Route selection has no content-query side effects. */
export function useComponentRoute() {
  const route = useRoute()
  const conceptId = computed(() => typeof route.params.concept === 'string' ? route.params.concept : '')
  const nameId = computed(() => typeof route.params.name === 'string' ? route.params.name : '')
  const concept = computed(() => componentCatalog().find(group => group.id === conceptId.value))
  const item = computed(() => concept.value?.items.find(entry => entry.id === nameId.value))
  return { conceptId, nameId, concept, item }
}

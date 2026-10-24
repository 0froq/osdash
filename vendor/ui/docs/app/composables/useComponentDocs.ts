import type { ReferenceCollectionItem } from '@nuxt/content'

export type ReferenceDoc = ReferenceCollectionItem

/** One query and one identity index, shared by every component reference page. */
export async function useComponentDocs() {
  const { locale } = useI18n()
  const { data } = await useAsyncData('component-reference', () => queryCollection('reference').all())
  const index = computed(() => new Map((data.value ?? []).map(doc => [doc.stem, doc])))

  function docFor(concept: string, name: string): ReferenceDoc | undefined {
    const stem = `${concept}/${name}`
    return (locale.value === 'zh' ? index.value.get(`${stem}.zh`) : undefined) ?? index.value.get(stem)
  }

  return { docFor }
}

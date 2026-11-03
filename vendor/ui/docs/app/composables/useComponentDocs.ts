import type { ReferenceCollectionItem } from '@nuxt/content'

export type ReferenceDoc = ReferenceCollectionItem
export type ReferenceSummary = Pick<ReferenceDoc, 'stem' | 'designStatus' | 'description'>

function pick<T extends { stem: string }>(
  index: Map<string, T>,
  locale: string,
  concept: string,
  name: string,
): T | undefined {
  const stem = `${concept}/${name}`
  return (locale === 'zh' ? index.get(`${stem}.zh`) : undefined) ?? index.get(stem)
}

/**
 * Status and description for every component, for the catalog pages.
 * It selects three fields. Pulling whole documents put about 1 MB of bodies and API tables in the page payload.
 */
export async function useComponentSummaries() {
  const { locale } = useI18n()
  const { data } = await useAsyncData('component-summaries', () =>
    queryCollection('reference').select('stem', 'designStatus', 'description').all(),
  )
  const index = computed(
    () => new Map<string, ReferenceSummary>((data.value ?? []).map(doc => [doc.stem, doc])),
  )

  return {
    docFor: (concept: string, name: string) => pick(index.value, locale.value, concept, name),
  }
}

/** The full document of one component: body, props, slots and events. */
export async function useComponentDoc(
  concept: () => string | undefined,
  name: () => string | undefined,
) {
  const { locale } = useI18n()
  const { data } = await useAsyncData(
    () => `component-doc-${locale.value}-${concept()}-${name()}`,
    async () => {
      const stem = `${concept()}/${name()}`
      const [localized, base] = await Promise.all([
        locale.value === 'zh'
          ? queryCollection('reference').where('stem', '=', `${stem}.zh`).first()
          : Promise.resolve(null),
        queryCollection('reference').where('stem', '=', stem).first(),
      ])
      return localized ?? base
    },
    { watch: [locale] },
  )
  return computed<ReferenceDoc | undefined>(() => data.value ?? undefined)
}

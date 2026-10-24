import type { MaybeRefOrGetter } from 'vue'
import type { ShareMetaInput } from './useShareMeta'
import { shareTitle, SITE_DESCRIPTION, SITE_NAME } from '~/utils/site'

function cardTitle(value: string | undefined): string {
  const titled = shareTitle(value)
  return titled || SITE_NAME
}

/** Generated paper card for routes that are not Nuxt Content entries. */
export function usePaperOgImage(
  share: ShareMetaInput,
  paper?: { title?: MaybeRefOrGetter<string | undefined> },
): void {
  const title = computed(() => cardTitle(
    paper?.title != null ? toValue(paper.title) : toValue(share.title),
  ))

  defineOgImage('Paper', {
    title: () => title.value,
    description: () => {
      const raw = share.description == null ? undefined : toValue(share.description)
      return (typeof raw === 'string' ? raw.trim() : '') || SITE_DESCRIPTION
    },
    words: 0,
  }, {
    alt: () => title.value,
  })

  useShareMeta({
    ...share,
    image: false,
  })
}

interface ContentPage {
  path: string
  title?: string | null
  description?: string | null
  cover?: string | null
  ogImage?: boolean | { url?: string, component?: string, props?: Record<string, unknown> } | null
  evergreen?: boolean | null
  kind?: string | null
  created?: string | null
  date?: string | null
  updated?: string | null
  last_modified?: string | null
  words?: number | null
}

/** Cover precedence + generated paper card for a Nuxt Content entry. */
export function useContentOgImage(
  page: MaybeRefOrGetter<ContentPage | null | undefined>,
  collection: string,
  share: Omit<ShareMetaInput, 'image'>,
): void {
  const files = useRuntimeConfig().public.publicFiles
  const override = computed(() => contentOgOverride(toValue(page), collection, files))
  const current = computed(() => toValue(page))

  if (override.value === undefined) {
    defineOgImage(ogComponentName(current.value), {
      title: () => paperFields(current.value).title,
      description: () => paperFields(current.value, SITE_DESCRIPTION).description,
      evergreen: () => paperFields(current.value).evergreen,
      created: () => paperFields(current.value).created,
      updated: () => paperFields(current.value).updated,
      words: () => paperFields(current.value).words,
      ...ogExtraProps(current.value),
    }, {
      alt: () => paperFields(current.value).title,
    })
  }

  useShareMeta({
    ...share,
    image: () => override.value === undefined ? false : override.value,
  })
}

/** Index/list routes under a collection (e.g. changelog) without a content file. */
export function useCollectionIndexOgImage(
  source: { collection: string, path: string },
  share: ShareMetaInput,
): void {
  const files = useRuntimeConfig().public.publicFiles
  const override = computed(() => explicitContentCover(source, path => hasShareFile(files, path)))

  if (!override.value) {
    defineOgImage('Paper', {
      title: () => cardTitle(toValue(share.title)),
      description: () => {
        const raw = share.description == null ? undefined : toValue(share.description)
        return (typeof raw === 'string' ? raw.trim() : '') || SITE_DESCRIPTION
      },
      words: 0,
    }, {
      alt: () => cardTitle(toValue(share.title)),
    })
  }

  useShareMeta({
    ...share,
    image: () => override.value ?? false,
  })
}

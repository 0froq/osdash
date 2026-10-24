import type { MaybeRefOrGetter } from 'vue'
import { absoluteImageUrl, canonicalUrl, OG_IMAGE_HEIGHT, OG_IMAGE_PATH, OG_IMAGE_WIDTH, shareTitle, SITE_NAME } from '~/utils/site'

export interface ShareMetaInput {
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  type?: MaybeRefOrGetter<'website' | 'article' | undefined>
  /**
   * Share image path or https URL.
   * `false` when defineOgImage owns `og:image`.
   * Omitted routes use `/og.png`.
   */
  image?: MaybeRefOrGetter<string | false | undefined>
}

function filled(value: string | undefined, fallback: string): string {
  const text = value?.trim()
  return text || fallback
}

/** Document title plus Open Graph / Twitter tags for the current route. */
export function useShareMeta(input: ShareMetaInput = {}): void {
  const route = useRoute()

  const title = computed(() => shareTitle(input.title == null ? undefined : toValue(input.title)))
  const description = computed(() => {
    const value = input.description == null ? undefined : toValue(input.description)
    return filled(value, SITE_DESCRIPTION)
  })
  const type = computed(() => toValue(input.type) ?? 'website')
  const url = computed(() => canonicalUrl(route.path))
  const skipImage = toValue(input.image) === false
  const image = computed(() => {
    const value = toValue(input.image)
    if (value === false || !value)
      return absoluteImageUrl(OG_IMAGE_PATH)
    return absoluteImageUrl(value)
  })

  useHead({
    title: () => input.title == null ? undefined : toValue(input.title) || undefined,
  })

  useSeoMeta({
    description: () => description.value,
    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogUrl: () => url.value,
    ogType: () => type.value,
    ogSiteName: SITE_NAME,
    twitterCard: 'summary_large_image',
    twitterTitle: () => title.value,
    twitterDescription: () => description.value,
  })

  if (!skipImage) {
    useSeoMeta({
      ogImage: () => image.value,
      ogImageSecureUrl: () => image.value,
      ogImageType: 'image/png',
      ogImageWidth: OG_IMAGE_WIDTH,
      ogImageHeight: OG_IMAGE_HEIGHT,
      ogImageAlt: () => title.value,
      twitterImage: () => image.value,
      twitterImageAlt: () => title.value,
    })
  }

  useHead({
    link: [{ rel: 'canonical', href: () => url.value }],
  })
}

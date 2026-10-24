/** Canonical origin (`og:url`). Matches the site URL in the README. */
export const SITE_ORIGIN = 'https://ui.froq.me'

/**
 * Share-image origin. X refuses to fetch froq.me, so `og:image` and
 * `twitter:image` use the Worker URL.
 */
export const IMAGE_ORIGIN = 'https://ui.sayhola.workers.dev'

export const SITE_NAME = 'froq/ui'

export const OG_IMAGE_PATH = '/og.png'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export const OG_IMAGE_URL = absoluteImageUrl(OG_IMAGE_PATH)

export const SITE_DESCRIPTION = 'Small controls, shared behavior, one visual language. Built for froq’s projects, with the details still open to refinement.'

/** Absolute canonical URL for a route path (`/` or `/zh/docs`). */
export function canonicalUrl(path: string): string {
  if (!path || path === '/')
    return SITE_ORIGIN
  return `${SITE_ORIGIN}${path.replace(/\/+$/, '')}`
}

/** Absolute https URL for a share image. Already-absolute https URLs pass through. */
export function absoluteImageUrl(src: string): string {
  if (/^https:\/\//i.test(src))
    return src
  const path = src.startsWith('/') ? src : `/${src}`
  return `${IMAGE_ORIGIN}${path}`
}

export function shareTitle(title: string | undefined | null): string {
  if (!title || title === SITE_NAME)
    return SITE_NAME
  return `${title} — ${SITE_NAME}`
}

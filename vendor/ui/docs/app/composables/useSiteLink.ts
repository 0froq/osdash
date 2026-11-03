const EXTERNAL = /^[a-z][a-z\d+.-]*:/i

/** Resolves a locale-free path such as `/docs` for the current locale. URLs pass through. */
export function useSiteLink(): (to: string) => string {
  const localePath = useLocalePath()
  return to => {
    if (EXTERNAL.test(to)) return to
    const [path = '/', hash] = to.split('#')
    const resolved = localePath(path || '/')
    return hash ? `${resolved}#${hash}` : resolved
  }
}

/** Nav targets. A section such as `/components` stays current on its child pages. */
export function useSectionHref(): {
  href: (to: string) => string
  current: (to: string) => 'page' | undefined
} {
  const route = useRoute()
  const link = useSiteLink()

  function href(to: string): string {
    return link(to)
  }

  function current(to: string): 'page' | undefined {
    const path = link(to)
    if (route.path === path) return 'page'
    if (to !== '/' && route.path.startsWith(`${path}/`)) return 'page'
    return undefined
  }

  return { href, current }
}

/** Locales that have a folder under `content/`. Any other locale reads the English one. */
const CONTENT_LOCALES: string[] = ['en', 'zh']

/** Content paths are prefixed with the locale folder: `/zh/docs/install`. */
export function useContentPath(): (path?: string) => string {
  const { locale } = useI18n()
  return (path = '') => {
    const folder = CONTENT_LOCALES.includes(locale.value) ? locale.value : 'en'
    return `/${folder}${path === '/' ? '' : path}`.replace(/\/$/, '')
  }
}

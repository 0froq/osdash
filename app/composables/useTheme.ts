import { THEME_KEY } from '~/theme'

export type ThemeName = 'light' | 'dark'

const themes = ['light', 'dark'] as const

export function useTheme() {
  const theme = ref<ThemeName>('light')
  const ready = ref(false)

  function setTheme(next: ThemeName): void {
    theme.value = next
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* Storage may be unavailable; the current theme still applies. */
    }
  }

  function onThemeKey(event: KeyboardEvent): void {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0
    if (step === 0) return
    event.preventDefault()
    const index = Math.max(0, themes.indexOf(theme.value))
    const next = themes[(index + step + themes.length) % themes.length]
    if (!next) return
    setTheme(next)
    const group = event.currentTarget
    if (group instanceof HTMLElement)
      group.querySelectorAll<HTMLElement>('[role="radio"]')[themes.indexOf(next)]?.focus()
  }

  onMounted(() => {
    theme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    ready.value = true
  })

  return { theme, ready, themes, setTheme, onThemeKey }
}

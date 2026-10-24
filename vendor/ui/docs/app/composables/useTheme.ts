const KEY = 'ui-theme'

type Theme = 'light' | 'dark'

/** Theme on `html[data-theme]`. The head script picks it before paint; this keeps it in sync. */
export function useTheme(): {
  theme: Ref<Theme>
  ready: Ref<boolean>
  next: ComputedRef<Theme>
  toggle: () => void
} {
  const theme = useState<Theme>('theme', () => 'light')
  const ready = useState('theme-ready', () => false)
  const hooked = useState('theme-hooked', () => false)
  const next = computed(() => theme.value === 'dark' ? 'light' : 'dark')

  function apply(value: Theme, persist: boolean): void {
    const root = document.documentElement
    root.dataset.theme = value
    root.classList.toggle('dark', value === 'dark')
    theme.value = value
    if (persist)
      localStorage.setItem(KEY, value)
  }

  if (import.meta.client && !hooked.value) {
    hooked.value = true
    onMounted(() => {
      theme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
      ready.value = true
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (!localStorage.getItem(KEY))
          apply(event.matches ? 'dark' : 'light', false)
      })
    })
  }

  function toggle(): void {
    apply(next.value, true)
  }

  return { theme, ready, next, toggle }
}

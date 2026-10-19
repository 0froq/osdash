export const THEME_KEY = 'kit-theme'

/** Before-paint theme pick, same storage key and order as LiG. */
export function themePreferenceScript(): string {
  return `(()=>{const KEY=${JSON.stringify(THEME_KEY)};let theme=null;try{theme=localStorage.getItem(KEY)}catch{}const next=theme==='light'||theme==='dark'?theme:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=next})()`
}

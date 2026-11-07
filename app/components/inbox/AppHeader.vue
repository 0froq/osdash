<script setup lang="ts">
import { Paper, Toggle } from '@froq/ui'
import type { InboxViewer } from '~/composables/useInbox'

const { t } = useI18n()

defineProps<{
  viewer: InboxViewer | null
  pending: boolean
  expanded: boolean
  /** Where we are below home, outermost first. Empty on home. */
  trail: string[]
}>()

const emit = defineEmits<{
  home: []
  toggle: []
  refresh: []
  logout: []
  settings: []
}>()

const { theme, ready, setTheme } = useTheme()
const dark = computed({
  get: () => ready.value && theme.value === 'dark',
  set: value => setTheme(value ? 'dark' : 'light'),
})
</script>

<template>
  <Paper
    fixed
    class="app-header"
  >
    <header class="header-bar">
      <div class="header-start">
        <AppButton
          variant="icon"
          class="nav-toggle"
          :disabled="!viewer"
          :aria-label="t('nav.section')"
          :aria-expanded="expanded"
          aria-controls="inbox-navigation"
          aria-haspopup="dialog"
          @click="emit('toggle')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M20 7H4" />
            <path
              d="M15 12H4"
              opacity="0.5"
            />
            <path
              d="M9 17H4"
              opacity="0.5"
            />
          </svg>
        </AppButton>
        <nav
          class="location"
          :aria-label="t('nav.path')"
        >
          <button
            type="button"
            class="brand"
            :aria-current="trail.length === 0 ? 'page' : undefined"
            @click="emit('home')"
            >{{ t('brand') }}<span class="brand-dot">.</span></button
          >
          <template
            v-for="(label, index) in trail"
            :key="label"
          >
            <span
              class="trail-sep"
              aria-hidden="true"
              >/</span
            >
            <span
              class="trail-item"
              :aria-current="index === trail.length - 1 ? 'page' : undefined"
              >{{ label }}</span
            >
          </template>
        </nav>
      </div>
      <div class="header-end">
        <Toggle
          v-model="dark"
          class="theme-toggle"
          :label="t('menu.theme')"
          :disabled="!ready"
        >
          <template #off>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="4"
              />
              <path
                d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1"
              />
            </svg>
          </template>
          <template #on>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
            </svg>
          </template>
        </Toggle>
        <ViewerMenu
          v-if="viewer"
          :name="viewer.name || viewer.login"
          :avatar-url="viewer.avatarUrl"
          :pending="pending"
          @refresh="emit('refresh')"
          @logout="emit('logout')"
          @settings="emit('settings')"
        />
      </div>
    </header>
  </Paper>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 5;
  border-bottom: 1px solid var(--line);
}

.header-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  height: var(--header-h);
  padding: 0 var(--main-pad);
}

.header-start,
.header-end {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.header-start {
  gap: 12px;
}

.nav-toggle {
  width: 36px;
  height: 36px;
  margin-left: -8px;
  color: var(--fg);
}

.nav-toggle svg {
  width: 24px;
  height: 24px;
}

.location {
  display: flex;
  gap: 10px;
  align-items: baseline;
  min-width: 0;
}

.brand {
  padding: 0;
  border: 0;
  background: none;
  color: var(--fg);
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 24px;
  letter-spacing: -0.01em;
  line-height: 1;
}

.brand:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 3px;
}

.brand-dot {
  color: var(--accent);
}

/* The current place reads as plain text after the brand; the brand is the way
   back, so only it is a button. */
.trail-sep {
  color: var(--faint);
  font-family: var(--font-meta);
  font-size: 14px;
}

.trail-item {
  overflow: hidden;
  color: var(--muted);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Toggle sizes a slotted icon to 1em, so the font size is the icon size. */
.theme-toggle {
  flex-shrink: 0;
  font-size: 20px;
}
</style>

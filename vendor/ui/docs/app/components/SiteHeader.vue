<script setup lang="ts">
import { Toggle } from '@froq/ui'
import List from '@iconify-vue/solar/list-line-duotone'
import Moon from '@iconify-vue/solar/moon-line-duotone'
import Sun from '@iconify-vue/solar/sun-line-duotone'

const link = useSiteLink()
const { t } = useI18n()
const { theme, ready, toggle } = useTheme()
// useTheme owns the persistence and the html attributes. Toggle only reads and requests a change.
const dark = computed({
  get: () => theme.value === 'dark',
  set: value => {
    if (value !== (theme.value === 'dark')) toggle()
  },
})
const { open: navOpen, available: hasSectionNav, trigger: navTrigger } = useSectionNavigation()
</script>

<template>
  <header class="l-top">
    <div class="l-brand-container">
      <button
        v-if="hasSectionNav"
        ref="navTrigger"
        type="button"
        class="l-control l-section-toggle"
        :aria-label="t('nav.section')"
        :aria-expanded="navOpen"
        aria-controls="section-navigation"
        aria-haspopup="dialog"
        @click="navOpen = !navOpen"
      >
        <List
          width="24"
          height="24"
          aria-hidden="true"
        />
      </button>
      <NuxtLink
        class="l-brand"
        :to="link('/')"
      >
        froq/ui<span class="l-dot">.</span>
      </NuxtLink>
    </div>
    <div class="l-actions">
      <SiteNav class="l-nav" />
      <div class="l-controls">
        <LanguageSwitcher />
        <Toggle
          v-model="dark"
          class="l-theme"
          :label="t('theme.label')"
          :disabled="!ready"
        >
          <template #off>
            <Sun
              width="20"
              height="20"
              aria-hidden="true"
            />
          </template>
          <template #on>
            <Moon
              width="20"
              height="20"
              aria-hidden="true"
            />
          </template>
        </Toggle>
      </div>
    </div>
  </header>
</template>

<style scoped>
.l-brand-container {
  grid-column: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.l-top {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 72px;
  padding: 0 var(--pad);
  font-size: 14px;
}

.l-brand {
  grid-column: 1;
  font-family: var(--ui-font-display);
  font-size: calc(24px * var(--title-scale));
  letter-spacing: -0.01em;
}

.l-dot {
  color: var(--ui-accent);
}

.l-actions {
  grid-column: 3;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.l-nav {
  min-width: 0;
}

.l-controls {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.l-control {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 8px;
  border: 0;
  background: none;
  color: var(--ui-fg);
  font: inherit;
  cursor: pointer;
}

/* Toggle sizes a slotted icon to 1em, so the font size is the icon size. */
.l-theme {
  flex-shrink: 0;
  font-size: 20px;
}

.l-section-toggle {
  display: none;
}

@media (max-width: 1024px) {
  .l-section-toggle {
    display: inline-grid;
  }
}

@media (max-width: 860px) {
  .l-top {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 16px;
    align-items: center;
    height: auto;
    min-height: 72px;
    padding-block: 20px;
  }

  .l-actions {
    grid-column: 2;
    gap: 12px;
  }

  .l-nav {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px 16px;
  }
}
@media (max-width: 600px) {
  .l-top {
    row-gap: 12px;
  }

  .l-brand {
    grid-row: 1;
  }

  .l-actions {
    display: contents;
  }

  .l-controls {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }

  .l-nav {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-content: flex-start;
  }
}
</style>

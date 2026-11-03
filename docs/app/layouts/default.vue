<script setup lang="ts">
import { Banner, Paper, UiDevtools } from '@froq/ui'

const { t } = useI18n()
const link = useSiteLink()
provideSectionNavigation()

// Sticky chrome (banner + header) height, so sticky sidebars can sit below it.
const chrome = useTemplateRef<HTMLElement>('chrome')
const chromeHeight = ref(0)
onMounted(() => {
  const el = chrome.value
  if (!el) return
  const observer = new ResizeObserver(() => {
    chromeHeight.value = el.offsetHeight
  })
  observer.observe(el)
  onBeforeUnmount(() => observer.disconnect())
})
</script>

<template>
  <Paper
    class="l-site ui"
    :style="{ '--chrome-h': `${chromeHeight}px` }"
  >
    <a
      class="l-skip"
      href="#main"
      >{{ t('site.skip') }}</a
    >
    <div class="l-page">
      <div
        ref="chrome"
        class="l-chrome"
      >
        <Paper fixed>
          <Banner :label="t('site.noticeLabel')">
            {{ t('site.wip') }}
            <template #actions>
              <NuxtLink :to="link('/components')">
                {{ t('site.noticeAction') }}
              </NuxtLink>
            </template>
          </Banner>
          <SiteHeader />
        </Paper>
      </div>
      <main id="main">
        <slot />
      </main>
      <SiteFooter />
    </div>
    <UiDevtools />
  </Paper>
</template>

<style scoped>
.l-site {
  --display-scale: 1;
  --title-scale: 1;
  --pad: clamp(20px, 4vw, 56px);
  --gap: 24px;
  --cols: 12;
  --span-margin: 3;
  --span-body: 9;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  min-height: 100%;
  min-height: 100dvh;
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  transition: color 0.6s var(--ui-ease);
}

.l-chrome {
  position: sticky;
  top: 0;
  z-index: 15;
}

/* Fade from the paper into the page below. */
.l-chrome::after {
  content: '';
  position: absolute;
  inset: 100% 0 auto;
  height: 32px;
  background: linear-gradient(to bottom, var(--ui-bg), transparent);
  pointer-events: none;
}

.l-page {
  position: relative;
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  min-width: 0;
}

main {
  flex: 1 0 auto;
}

.l-skip {
  position: absolute;
  top: 12px;
  left: var(--pad);
  z-index: 20;
  padding: 6px 10px;
  background: var(--ui-bg);
  font-size: 13px;
  translate: 0 -200%;
}

.l-skip:focus {
  translate: 0;
}
</style>

<script setup lang="ts">
import { Banner, Paper } from '@froq/ui'

const { t } = useI18n()
const link = useSiteLink()
</script>

<template>
  <Paper class="l-site ui">
    <a
      class="l-skip"
      href="#main"
    >{{ t('site.skip') }}</a>
    <Banner :label="t('site.noticeLabel')">
      {{ t('site.wip') }}
      <template #actions>
        <NuxtLink :to="link('/components')">
          {{ t('site.noticeAction') }}
        </NuxtLink>
      </template>
    </Banner>
    <div class="l-page">
      <SiteHeader />
      <main id="main">
        <slot />
      </main>
      <SiteFooter />
    </div>
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

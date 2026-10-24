<script setup lang="ts">
const { t, locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const { ready, next, toggle } = useTheme()
const others = computed(() => locales.value.filter(item => item.code !== locale.value))
</script>

<template>
  <footer class="l-foot">
    <a href="https://github.com/0froq/ui">0froq/ui</a>
    <SiteNav class="l-nav" />
    <span class="l-controls">
      <NuxtLink
        v-for="item in others"
        :key="item.code"
        :to="switchLocalePath(item.code)"
        :lang="item.language"
      >{{ item.name }}</NuxtLink>
      <button
        v-if="ready"
        type="button"
        @click="toggle"
      >
        {{ t(`theme.${next}`) }}
      </button>
    </span>
  </footer>
</template>

<style scoped>
.l-foot {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: baseline;
  padding: 24px var(--pad) 32px;
  border-top: 1px solid var(--ui-line);
  font-size: 13px;
  color: var(--ui-muted);
}

.l-foot a,
.l-controls button {
  transition: color 0.3s;
}

.l-foot a:hover,
.l-controls button:hover {
  color: var(--ui-fg);
}

.l-controls {
  display: flex;
  gap: 20px;
  justify-self: end;
}

.l-controls button {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

@media (max-width: 860px) {
  .l-foot {
    grid-template-columns: 1fr auto;
  }

  .l-nav {
    grid-row: 2;
    grid-column: 1 / -1;
    flex-wrap: wrap;
    gap: 12px 20px;
  }
}
</style>

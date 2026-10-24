<script setup lang="ts">
const link = useSiteLink()
</script>

<template>
  <header class="l-top">
    <NuxtLink
      class="l-brand"
      :to="link('/')"
    >
      froq/ui<span class="l-dot">.</span>
    </NuxtLink>
    <SiteNav class="l-nav" />
  </header>
</template>

<style scoped>
.l-top {
  position: absolute;
  inset: 0 0 auto;
  z-index: 10;
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

.l-nav {
  grid-column: 3;
  justify-self: end;
}

@media (max-width: 860px) {
  .l-top {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    height: auto;
    min-height: 72px;
    padding-block: 20px;
  }

  .l-nav {
    grid-column: 2;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px 16px;
  }
}
</style>

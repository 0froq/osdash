<template>
  <div
    class="inbox-shell"
    :data-mobile="mobile ? '1' : '0'"
  >
    <slot name="sidebar" />
    <div class="inbox-main">
      <div class="inbox-inner">
        <slot />
      </div>
    </div>
    <slot name="preview" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ mobile: boolean }>()
</script>

<style scoped>
.inbox-shell {
  --main-pad: clamp(20px, 4vw, 56px);
  display: grid;
  grid-template-columns: 216px minmax(0, 1fr);
  min-height: 100vh;
  min-width: 0;
}

.inbox-main {
  min-width: 0;
  padding: 40px var(--main-pad) 96px;
}

.inbox-inner {
  min-width: 0;
  max-width: 760px;
  margin: 0 auto;
}

@media (min-width: 1100px) {
  .inbox-shell {
    grid-template-columns: 216px minmax(0, 1fr) 460px;
  }
}

@media (max-width: 760px) {
  .inbox-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .inbox-main {
    padding: 20px var(--main-pad) 64px;
  }
}
</style>

<template>
  <div
    class="inbox-shell"
    :data-mobile="mobile ? '1' : '0'"
  >
    <slot name="header" />
    <div class="inbox-body">
      <div class="inbox-main">
        <div class="inbox-inner">
          <slot />
        </div>
      </div>
      <slot name="preview" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ mobile: boolean }>()
</script>

<style scoped>
.inbox-shell {
  --main-pad: clamp(20px, 4vw, 56px);
  --header-h: 60px;
  min-height: 100vh;
  min-width: 0;
}

.inbox-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
}

.inbox-main {
  min-width: 0;
  padding: 40px var(--main-pad) 96px;
}

/* The card reads its own width from this container: with the preview docked
   the column can drop below what the two-column card needs. */
.inbox-inner {
  min-width: 0;
  max-width: 760px;
  margin: 0 auto;
  container: inbox / inline-size;
}

@media (min-width: 1100px) {
  .inbox-body {
    grid-template-columns: minmax(0, 1fr) 460px;
  }
}

@media (max-width: 1100px) {
  .inbox-main {
    padding: 20px var(--main-pad) 64px;
  }
}
</style>

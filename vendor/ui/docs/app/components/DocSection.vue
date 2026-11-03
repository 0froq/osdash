<script setup lang="ts">
defineProps<{
  title: string
  lede?: string
  kicker?: string
  to?: string
}>()
</script>

<template>
  <section class="doc-section">
    <PageHead
      variant="article"
      :heading="2"
      :title="title"
      :lede="lede"
      :kicker="kicker"
      :to="to"
      class="doc-section-head"
    >
      <template
        v-if="$slots.meta"
        #meta
        ><slot name="meta"
      /></template>
      <template
        v-if="$slots.actions"
        #actions
        ><slot name="actions"
      /></template>
    </PageHead>
    <slot />
  </section>
</template>

<style scoped>
.doc-section {
  margin-top: 2.4em;
  scroll-margin-top: calc(var(--chrome-h, 0px) + 24px);
}

.doc-section:first-child {
  margin-top: 0;
}

.doc-section-head {
  margin-bottom: 20px;
}
</style>

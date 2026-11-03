<script setup lang="ts">
defineProps<{
  title?: string
  lede?: string
  kicker?: string
  value?: { body: unknown }
}>()
</script>

<template>
  <article class="doc-page">
    <PageHead
      v-if="title || lede || kicker || $slots.kicker || $slots.meta"
      variant="article"
      :title="title"
      :lede="lede"
      :kicker="kicker"
      class="doc-head"
    >
      <template
        v-if="$slots.kicker"
        #kicker
        ><slot name="kicker"
      /></template>
      <template
        v-if="$slots.meta"
        #meta
        ><slot name="meta"
      /></template>
    </PageHead>
    <slot name="lead" />
    <DocBody
      v-if="value"
      :value="value"
    />
    <slot />
    <footer
      v-if="$slots.footer"
      class="doc-footer"
      ><slot name="footer"
    /></footer>
  </article>
</template>

<style scoped>
.doc-page {
  width: 100%;
  max-width: 48rem;
  margin-inline: auto;
  min-width: 0;
  font-size: 16px;
  line-height: 1.7;
}

.doc-head {
  margin-bottom: 32px;
}

.doc-footer {
  margin-top: clamp(48px, 8vh, 96px);
}
</style>

<script setup lang="ts">
const props = defineProps<{
  kicker?: string
  title?: string
  lede?: string
  /** A title long enough to wrap, set smaller than a single word. */
  long?: boolean
  /** Poster and section heads introduce a collection. Article heads use the reading layout. */
  variant?: 'poster' | 'section' | 'article'
  heading?: 1 | 2
  to?: string
}>()

const mark = computed(() => {
  const text = props.title ?? ''
  const found = text.match(/^(.*?)([.。])$/)
  if (found) return { body: found[1] ?? '', stop: found[2] ?? '' }
  return { body: text, stop: text ? '.' : '' }
})
</script>

<template>
  <header
    v-if="title || lede || kicker || $slots.kicker || $slots.meta || $slots.actions"
    class="l-page-head"
    :class="{ 'is-section': variant === 'section', 'is-article': variant === 'article' }"
  >
    <p
      v-if="variant === 'article' && (kicker || $slots.kicker)"
      class="l-kicker"
    >
      <slot name="kicker">{{ kicker }}</slot>
    </p>
    <div class="l-title-row">
      <component
        :is="heading === 2 ? 'h2' : 'h1'"
        v-if="title"
        class="l-page-title"
        :class="{ 'is-long': long }"
      >
        <NuxtLink
          v-if="to"
          :to="to"
          >{{ title }}</NuxtLink
        >
        <template v-else-if="variant === 'article'">{{ title }}</template>
        <template v-else
          >{{ mark.body
          }}<span
            v-if="mark.stop"
            class="l-mark"
            >{{ mark.stop }}</span
          ></template
        >
      </component>
      <div
        v-if="$slots.actions"
        class="l-actions"
        ><slot name="actions"
      /></div>
    </div>
    <div
      v-if="variant !== 'article' || lede || $slots.meta"
      class="l-page-foot"
    >
      <p
        v-if="variant !== 'article' && (kicker || $slots.kicker)"
        class="l-kicker"
      >
        <slot name="kicker">
          {{ kicker }}
        </slot>
      </p>
      <p
        v-if="lede"
        class="l-lede"
      >
        {{ lede }}
      </p>
      <p
        v-if="$slots.meta"
        class="l-meta"
      >
        <slot name="meta" />
      </p>
    </div>
  </header>
</template>

<style scoped>
.l-page-head {
  display: grid;
  align-content: end;
  min-height: 78svh;
  padding: 0 var(--pad) clamp(32px, 6vh, 64px);
}

.l-title-row {
  min-width: 0;
}

.l-page-head.is-article {
  display: block;
  min-height: 0;
  padding: 0;
}

.is-article > .l-kicker {
  margin-bottom: 12px;
}

.is-article .l-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

/* Article heads have no actions, so the row is a plain block and the title takes the full
   measure of the column. */
.is-article .l-title-row:not(:has(.l-actions)) {
  display: block;
}

.is-article .l-page-title {
  min-width: 0;
  margin: 0;
  font-size: calc(clamp(36px, 4vw, 56px) * var(--title-scale));
  line-height: 1.1;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}

.is-article h2.l-page-title {
  font-size: calc(clamp(30px, 2.8vw, 40px) * var(--title-scale));
}

.is-article .l-page-foot {
  display: block;
  margin-top: 16px;
  padding: 0;
  border: 0;
}

.is-article .l-lede {
  max-width: 36rem;
}

.is-article .l-lede + .l-meta,
.is-article .l-kicker + .l-meta {
  margin-top: 12px;
}

.l-actions {
  flex-shrink: 0;
}

.l-page-head.is-section {
  width: 100%;
  max-width: 48rem;
  margin-inline: auto;
  min-height: 0;
  padding: 28px 0;
}

.is-section .l-page-title.is-long {
  font-size: clamp(44px, 6vw, 80px);
}

.is-section .l-page-foot {
  grid-template-columns: minmax(0, 1fr) auto;
}

.is-section .l-page-foot > * {
  grid-column: auto;
}

.l-page-title {
  margin: 0 0 0 -0.04em;
  font-family: var(--ui-font-display);
  font-weight: 400;
  font-size: calc(clamp(96px, 17vw, 280px) * var(--display-scale));
  line-height: 0.82;
  letter-spacing: -0.04em;
}

.l-page-title.is-long {
  max-width: 14ch;
  margin-left: 0;
  font-size: calc(clamp(56px, 8vw, 128px) * var(--display-scale));
  line-height: 0.95;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.l-mark {
  display: inline-block;
  color: var(--ui-accent);
}

:is(:lang(zh), :lang(ja)) .l-page-title {
  letter-spacing: 0;
}

:is(:lang(zh), :lang(ja)) .l-page-title.is-long {
  line-height: 1.15;
}

.l-page-foot {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: var(--gap);
  align-items: baseline;
  margin-top: clamp(28px, 5vh, 56px);
  padding-top: 20px;
  border-top: 1px solid var(--ui-line);
}

.l-kicker {
  grid-column: span var(--span-margin);
  margin: 0;
  font-family: var(--ui-font-meta);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ui-muted);
}

.l-kicker :deep(a:hover) {
  color: var(--ui-fg);
}

.l-lede {
  grid-column: calc(var(--span-margin) + 1) / span 6;
  max-width: 30rem;
  margin: 0;
  color: var(--ui-muted);
}

.l-meta {
  grid-column: 10 / span 3;
  justify-self: end;
  margin: 0;
  font-size: 14px;
  color: var(--ui-muted);
}

@media (max-width: 860px) {
  .l-page-foot,
  .is-section .l-page-foot {
    grid-template-columns: 1fr;
  }

  .l-kicker,
  .l-lede,
  .l-meta {
    grid-column: 1 / -1;
    justify-self: start;
  }
}
</style>

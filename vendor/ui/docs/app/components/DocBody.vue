<script setup lang="ts">
withDefaults(defineProps<{
  /** Release notes: a plain list, not the usual indented prose list. */
  notes?: boolean
}>(), {
  notes: false,
})
</script>

<template>
  <div
    class="l-doc"
    :class="{ 'l-notes': notes }"
  >
    <slot />
  </div>
</template>

<style scoped>
.l-doc {
  max-width: 42rem;
  font-size: 16px;
  line-height: 1.7;
}

.l-doc :deep(h2) {
  margin: 2.4em 0 0.6em;
  font-family: var(--ui-font-display);
  font-weight: 400;
  font-size: calc(clamp(30px, 2.8vw, 40px) * var(--title-scale));
  line-height: 1.1;
  letter-spacing: -0.015em;
}

.l-doc :deep(h3) {
  margin: 2em 0 0.5em;
  font-size: 17px;
  font-weight: 500;
}

.l-doc :deep(:is(h2, h3, h4) a) {
  color: inherit;
  text-decoration: none;
}

.l-doc :deep(.l-md > :first-child) {
  margin-top: 0;
}

.l-doc :deep(p),
.l-doc :deep(ul),
.l-doc :deep(ol) {
  margin: 0 0 1em;
}

.l-doc :deep(ul),
.l-doc :deep(ol) {
  padding-left: 1.2em;
}

.l-doc :deep(li) {
  margin: 0.3em 0;
}

.l-doc :deep(p a),
.l-doc :deep(li a) {
  text-decoration: underline;
  text-decoration-color: var(--ui-faint);
  text-underline-offset: 3px;
  transition: text-decoration-color 0.3s;
}

.l-doc :deep(p a:hover),
.l-doc :deep(li a:hover) {
  text-decoration-color: var(--ui-fg);
}

.l-doc :deep(pre) {
  overflow-x: auto;
  margin: 1.4em 0;
  padding: 16px 18px;
  border: 1px solid var(--ui-line);
  font-size: 13.5px;
  line-height: 1.6;
}

.l-doc :deep(pre code) {
  font-size: inherit;
}

.l-doc :deep(:not(pre) > code) {
  padding: 0.1em 0.35em;
  border: 1px solid var(--ui-line);
  border-radius: 3px;
}

.l-doc :deep(blockquote) {
  margin: 1.4em 0;
  padding-left: 16px;
  border-left: 1px solid var(--ui-line);
  color: var(--ui-muted);
}

.l-doc :deep(table) {
  width: 100%;
  margin: 1.4em 0;
  border-collapse: collapse;
  font-size: 14px;
}

.l-doc :deep(th),
.l-doc :deep(td) {
  padding: 10px 12px 10px 0;
  border-top: 1px solid var(--ui-line);
  text-align: left;
  vertical-align: top;
}

.l-doc :deep(th) {
  font-weight: 400;
  color: var(--ui-muted);
}

.l-doc :deep(hr) {
  margin: 2.4em 0;
  border: 0;
  border-top: 1px solid var(--ui-line);
}

.l-notes :deep(ul) {
  max-width: 34rem;
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
}

.l-notes :deep(li) {
  margin: 0;
  padding: 10px 0;
  border-top: 1px solid var(--ui-line);
}

.l-notes :deep(li:first-child) {
  padding-top: 0;
  border-top: 0;
}
</style>

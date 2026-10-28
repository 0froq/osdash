<script setup lang="ts">
import { renderMarkdown } from '#shared/markdown'

const props = defineProps<{ source: string; baseUrl?: string }>()
// The shared renderer parses raw HTML, sanitizes it, and validates every link.
const html = computed(() => renderMarkdown(props.source, props.baseUrl))
</script>

<template>
  <div
    class="markdown-body"
    v-html="html"
  />
</template>

<style scoped>
.markdown-body {
  min-width: 0;
  overflow-wrap: anywhere;
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(blockquote),
.markdown-body :deep(pre),
.markdown-body :deep(table),
.markdown-body :deep(details),
.markdown-body :deep(dl) {
  margin-block: 8px;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-block: 12px 6px;
  font-size: 1em;
  font-weight: 600;
  line-height: 1.4;
}

.markdown-body :deep(> :first-child) {
  margin-top: 0;
}

.markdown-body :deep(> :last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(a) {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.markdown-body :deep(ul) {
  padding-left: 20px;
  list-style: disc;
}

.markdown-body :deep(ol) {
  padding-left: 20px;
  list-style: decimal;
}

.markdown-body :deep(li) {
  display: list-item;
  margin-block: 3px;
}

.markdown-body :deep(.task-list-item) {
  list-style: none;
}

.markdown-body :deep(input[type='checkbox']) {
  margin-right: 5px;
  accent-color: var(--accent);
}

.markdown-body :deep(blockquote) {
  padding-left: 10px;
  border-left: 2px solid var(--line);
  color: var(--muted);
}

.markdown-body :deep(code),
.markdown-body :deep(kbd) {
  padding: 1px 4px;
  border-radius: 3px;
  background: color-mix(in oklab, var(--fg) 6%, transparent);
  font-family: var(--font-meta);
  font-size: 0.9em;
}

.markdown-body :deep(pre) {
  max-width: 100%;
  overflow-x: auto;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: color-mix(in oklab, var(--fg) 3%, transparent);
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  white-space: pre;
}

.markdown-body :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  font-size: 0.92em;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 5px 8px;
  border: 1px solid var(--line);
}

.markdown-body :deep(th) {
  font-weight: 600;
}

.markdown-body :deep(summary) {
  cursor: pointer;
  font-weight: 500;
}

.markdown-body :deep(hr) {
  margin-block: 12px;
  border: 0;
  border-top: 1px solid var(--line);
}

.markdown-body :deep(dd) {
  margin-left: 16px;
}
</style>

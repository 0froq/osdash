<script setup lang="ts">
import type { TagItem } from '../../vue'

defineProps<{
  items: TagItem[]
  /** Names the list for assistive tech. */
  label?: string
}>()
const emit = defineEmits<{ activate: [item: TagItem, event: MouseEvent] }>()
defineSlots<{
  tag?: (scope: { item: TagItem }) => unknown
}>()
</script>

<template>
  <ul
    v-if="items.length > 0"
    class="ui-tags"
    role="list"
    :aria-label="label"
  >
    <li
      v-for="item in items"
      :key="item.value"
      class="ui-tag"
      :class="{ 'is-accent': item.tone === 'accent', 'is-pending': item.pending }"
    >
      <slot
        name="tag"
        :item="item"
      >
        <a
          v-if="item.href"
          class="ui-tag-link"
          :href="item.href"
          :target="item.external ? '_blank' : undefined"
          :rel="item.external ? 'noreferrer' : undefined"
          @click="emit('activate', item, $event)"
          >{{ item.label }}</a
        >
        <template v-else>{{ item.label }}</template>
      </slot>
    </li>
  </ul>
</template>

<style scoped>
/* Quiet words in meta type. Each carries the small capsule Pick and Sidebar
   draw on their leading edge: neutral at rest, accent when the tag asks for a
   look. A tag is a fact about its subject, so it is not a pill. */
.ui-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--ui-muted);
  font-family: var(--ui-font-meta);
  font-size: 10.5px;
  letter-spacing: 0.02em;
  line-height: 1.5;
}

.ui-tag {
  position: relative;
  max-width: 100%;
  padding-inline-start: 9px;
  overflow-wrap: anywhere;
}

.ui-tag::before {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 0;
  width: 3px;
  height: 10px;
  border-radius: 1px;
  background: var(--ui-faint);
  content: '';
  transform: translateY(-50%);
}

.ui-tag.is-accent {
  color: var(--ui-fg);
}

.ui-tag.is-accent::before {
  background: var(--ui-accent);
}

/* Not done yet: the dashed line the library uses for what is still open. */
.ui-tag.is-pending {
  text-decoration: underline dashed var(--ui-faint);
  text-underline-offset: 3px;
}

.ui-tag-link {
  color: inherit;
  text-decoration: none;
  transition: color var(--ui-dur) var(--ui-ease);
}

.ui-tag-link:hover {
  color: var(--ui-fg);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.ui-tag-link:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 3px;
}
</style>

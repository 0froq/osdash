<script setup lang="ts">
/**
 * An underlined link to GitHub: a name, a "#52" number, or a person. The text
 * sits in a slot so anything can be linked; pass `avatar` to prefix a round
 * avatar inside the same link.
 */
defineProps<{
  url: string
  title?: string
  avatar?: string
  /** Avatar height in `em`, matches the text line it sits in. */
  avatarSize?: number
}>()
</script>

<template>
  <a
    class="link"
    :href="url"
    :title="title"
    target="_blank"
    rel="noreferrer"
  >
    <img
      v-if="avatar"
      class="link-avatar"
      :style="{ width: `${avatarSize ?? 1.35}em`, height: `${avatarSize ?? 1.35}em` }"
      :src="avatar"
      alt=""
    />
    <span class="link-text"><slot /></span>
  </a>
</template>

<style scoped>
.link {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  color: inherit;
  text-decoration: none;
}

.link-text {
  overflow: hidden;
  border-bottom: 1px solid color-mix(in oklab, currentColor 28%, transparent);
  color: var(--fg);
  font-family: var(--font-meta);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: border-color var(--dur-2) var(--ease);
}

.link:hover .link-text,
.link:focus-visible .link-text {
  border-bottom-color: currentColor;
}

.link-avatar {
  flex: none;
  border: 1px solid var(--line);
  border-radius: 50%;
}
</style>

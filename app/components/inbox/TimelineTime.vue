<script setup lang="ts">
const { t } = useI18n()
import { absoluteTime, shortAge } from '~/utils/time'

const props = defineProps<{ at: string; nowMs: number; url?: string | null }>()

const title = computed(() => {
  const full = absoluteTime(props.at)
  return props.url ? `${full} · ${t('story.permalink')}` : full
})
</script>

<template>
  <a
    v-if="url"
    class="st-when"
    :href="url"
    :title="title"
    target="_blank"
    rel="noreferrer"
    ><time :datetime="at">{{ shortAge(t, at, nowMs) }}</time></a
  >
  <time
    v-else
    class="st-when"
    :datetime="at"
    :title="title"
    >{{ shortAge(t, at, nowMs) }}</time
  >
</template>

<style scoped>
.st-when {
  margin-left: auto;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11px;
  text-decoration: none;
  transition: color 160ms var(--ease);
}

a.st-when:hover,
a.st-when:focus-visible {
  color: var(--fg);
}
</style>

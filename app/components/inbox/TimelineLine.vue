<script setup lang="ts">
import { copy } from '~/copy/en'
import type { StoryLine } from '~/utils/story'

const props = defineProps<{
  line: StoryLine
  minor: boolean
  nowMs: number
  /** Number shown as `on #N` when the line is not on the card's own item. */
  elsewhere: number | null
}>()

const who = computed(() => {
  if (props.line.actor === 'checks') return ''
  return props.line.self ? copy.story.you : props.line.actor
})
</script>

<template>
  <div
    class="st-text"
    :class="[`tone-${line.tone}`, { minor, reason: line.reason }]"
  >
    <p class="st-head">
      <span
        v-if="who"
        class="st-who"
        >{{ who }}</span
      >
      <span class="st-verb">{{ line.verb }}</span>
      <span
        v-if="elsewhere !== null"
        class="st-on"
        >{{ copy.story.on(elsewhere) }}</span
      >
      <span
        v-for="tag in line.tags"
        :key="tag"
        class="st-tag"
        :class="`t-${tag}`"
        >{{ copy.story.tag[tag] }}</span
      >
      <TimelineTime
        :at="new Date(line.at).toISOString()"
        :now-ms="nowMs"
        :url="line.url"
      />
    </p>
    <p
      v-if="line.quote && !minor"
      class="st-quote"
    >
      {{ line.quote }}
    </p>
    <p
      v-else-if="line.quote || line.detail"
      class="st-detail"
    >
      {{ line.quote ?? line.detail }}
    </p>
    <p
      v-if="line.chips.length"
      class="st-chips"
    >
      <span
        v-for="chip in line.chips"
        :key="chip"
        >{{ chip }}</span
      >
    </p>
  </div>
</template>

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

<style scoped>
.st-head {
  display: flex;
  flex-wrap: wrap;
  gap: 0 6px;
  align-items: baseline;
  font-size: 14px;
  line-height: 20px;
}

.st-who {
  font-weight: 600;
}

.tone-bad .st-verb {
  color: var(--st-bad);
}

.tone-good .st-verb {
  color: var(--st-good);
}

.st-on,
.st-tag {
  font-family: var(--font-meta);
  font-size: 10.5px;
}

.st-on {
  color: var(--muted);
}

.st-tag {
  padding: 0 6px;
  border: 1px solid var(--line);
  border-radius: 99px;
  color: var(--muted);
  line-height: 16px;
}

.st-tag.t-claim {
  border-color: transparent;
  background: color-mix(in oklab, var(--fg) 9%, transparent);
  color: var(--fg);
}

.st-quote {
  margin-top: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--st-soft);
  font-size: 13.5px;
  line-height: 1.55;
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

.st-text.reason .st-quote {
  background: color-mix(in oklab, var(--fg) 7%, transparent);
}

.turn-you .st-text.reason .st-quote {
  background: color-mix(in oklab, var(--accent) 9%, transparent);
}

.st-detail {
  overflow: hidden;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.st-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.st-chips span {
  padding: 1px 7px;
  border: 1px solid var(--line);
  border-radius: 99px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 10.5px;
}

.st-text.minor .st-head {
  color: var(--muted);
  font-size: 12.5px;
  line-height: 18px;
}

.st-text.minor .st-who {
  color: var(--fg);
  font-weight: 500;
}

.st-text.minor .st-tag {
  line-height: 14px;
}

@media (max-width: 760px) {
  .st-head {
    font-size: 13.5px;
  }
}
</style>

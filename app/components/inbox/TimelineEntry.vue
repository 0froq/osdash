<script setup lang="ts">
import type { UnitEvent } from '#shared/events'
import { copy } from '~/copy/zh-CN'
import { actorLabel, eventAction } from '~/utils/event'
import { absoluteTime, relativeAge } from '~/utils/time'

const props = defineProps<{
  event: UnitEvent
  viewer: string
  showSource: boolean
}>()

const expanded = ref(false)
const age = computed(() => relativeAge(Date.now() - Date.parse(props.event.at)))
const absolute = computed(() => absoluteTime(props.event.at))
const dot = computed(() => {
  if (props.event.kind === 'merged') return 'info'
  if (props.event.kind === 'review' && props.event.reviewState === 'CHANGES_REQUESTED')
    return 'accent'
  if (props.event.ci?.conclusion === 'FAILURE' || props.event.ci?.conclusion === 'TIMED_OUT')
    return 'accent'
  return 'fg'
})
</script>

<template>
  <li class="tl-entry">
    <span
      class="tl-dot"
      :class="dot"
    />
    <div class="tl-body">
      <p class="tl-line">
        <span class="tl-actor">{{ actorLabel(event.actor.login, viewer) }}</span>
        {{ eventAction(event) }}
        <time
          class="tl-time"
          :datetime="event.at"
          :title="absolute"
          >{{ age }}</time
        >
      </p>
      <p
        v-if="showSource"
        class="tl-source"
      >
        {{
          event.source.kind === 'pr'
            ? copy.sourcePr(event.source.number)
            : copy.sourceIssue(event.source.number)
        }}
      </p>
      <p
        v-if="event.excerpt"
        class="tl-excerpt"
        :class="{ expanded }"
        >{{ event.excerpt }}</p
      >
      <button
        v-if="event.excerpt"
        class="tl-expand"
        type="button"
        @click="expanded = !expanded"
      >
        {{ expanded ? copy.preview.collapse : copy.preview.expand }}
      </button>
      <a
        v-if="event.url"
        class="card-link"
        :href="event.url"
        target="_blank"
        rel="noreferrer"
        >{{ copy.preview.source }}</a
      >
    </div>
  </li>
</template>

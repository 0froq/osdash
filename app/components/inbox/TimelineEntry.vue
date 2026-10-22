<script setup lang="ts">
import type { UnitEvent } from '#shared/events'
import { copy } from '~/copy/en'
import { actorLabel, eventAction, eventSourceLabel, type TimelineSubject } from '~/utils/event'
import { absoluteTime, relativeAge } from '~/utils/time'

const props = defineProps<{
  event: UnitEvent
  viewer: string
  subject: TimelineSubject
}>()

const expanded = ref(false)
const age = computed(() => relativeAge(Date.now() - Date.parse(props.event.at)))
const absolute = computed(() => absoluteTime(props.event.at))
const sourceLabel = computed(() => eventSourceLabel(props.event, props.subject))
const issueRef = computed(() => {
  const ref = props.event.ref
  if (!ref || ref.kind !== 'issue') return null
  if (sourceLabel.value === copy.sourceIssue(ref.number)) return null
  return copy.sourceIssue(ref.number)
})
const expandable = computed(() => Boolean(props.event.excerpt || props.event.url))
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
    <button
      v-if="expandable"
      class="tl-row"
      type="button"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span
        class="tl-dot"
        :class="[dot, { hollow: !expanded }]"
      />
      <span class="tl-body">
        <span class="tl-line">
          <span class="tl-actor">{{ actorLabel(event.actor.login, viewer) }}</span>
          {{ eventAction(event) }}
          <span
            v-if="issueRef"
            class="tl-source"
            >{{ issueRef }}</span
          >
          <span
            v-else-if="sourceLabel"
            class="tl-source"
            >{{ sourceLabel }}</span
          >
          <time
            class="tl-time"
            :datetime="event.at"
            :title="absolute"
            >{{ age }}</time
          >
        </span>
      </span>
    </button>
    <div
      v-else
      class="tl-row"
    >
      <span
        class="tl-dot"
        :class="dot"
      />
      <span class="tl-body">
        <span class="tl-line">
          <span class="tl-actor">{{ actorLabel(event.actor.login, viewer) }}</span>
          {{ eventAction(event) }}
          <span
            v-if="issueRef"
            class="tl-source"
            >{{ issueRef }}</span
          >
          <span
            v-else-if="sourceLabel"
            class="tl-source"
            >{{ sourceLabel }}</span
          >
          <time
            class="tl-time"
            :datetime="event.at"
            :title="absolute"
            >{{ age }}</time
          >
        </span>
      </span>
    </div>
    <div
      v-if="expanded"
      class="tl-detail"
    >
      <p
        v-if="event.excerpt"
        class="tl-excerpt expanded"
        >{{ event.excerpt }}</p
      >
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

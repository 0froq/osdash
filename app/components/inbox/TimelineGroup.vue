<script setup lang="ts">
import type { BotGroup, CiGroup } from '#shared/events'
import { copy } from '~/copy/en'
import type { TimelineSubject } from '~/utils/event'
import { relativeAge } from '~/utils/time'

const props = defineProps<{
  group: BotGroup | CiGroup
  viewer: string
  subject: TimelineSubject
}>()

const open = ref(false)
const at = computed(() => (props.group.kind === 'bot-group' ? props.group.from : props.group.at))
const label = computed(() =>
  props.group.kind === 'bot-group'
    ? copy.botGroup(props.group.count)
    : copy.ciGroup(props.group.passed, props.group.failed),
)
</script>

<template>
  <li class="tl-group">
    <button
      class="tl-group-toggle"
      type="button"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span
        class="tl-dot"
        :class="[
          group.kind === 'ci-group' && group.failed > 0 ? 'accent' : 'muted',
          { hollow: !open },
        ]"
      />
      <span>{{ label }}</span>
      <time class="tl-time">{{ relativeAge(Date.now() - Date.parse(at)) }}</time>
    </button>
    <ul v-if="open">
      <TimelineEntry
        v-for="event in group.events"
        :key="event.id"
        :event="event"
        :viewer="viewer"
        :subject="subject"
      />
    </ul>
  </li>
</template>

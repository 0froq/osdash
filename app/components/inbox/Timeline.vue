<script setup lang="ts">
import type { TimelineEntry as Entry } from '#shared/events'
import { copy } from '~/copy/en'
import type { TimelineSubject } from '~/utils/event'
import { absoluteDay } from '~/utils/time'

const props = defineProps<{
  entries: Entry[]
  viewer: string
  truncated: boolean
  originalUrl: string
  subject: TimelineSubject
}>()

function atOf(entry: Entry): string {
  if (entry.kind === 'bot-group') return entry.from
  if (entry.kind === 'ci-group') return entry.at
  return entry.at
}

const days = computed(() => {
  const groups: Array<{ label: string; entries: Entry[] }> = []
  for (const entry of props.entries) {
    const label = absoluteDay(atOf(entry))
    const last = groups[groups.length - 1]
    if (!last || last.label !== label) groups.push({ label, entries: [entry] })
    else last.entries.push(entry)
  }
  return groups
})
</script>

<template>
  <div class="tl">
    <section
      v-for="day in days"
      :key="day.label"
    >
      <h3 class="tl-day">{{ day.label }}</h3>
      <ul class="tl-list">
        <template
          v-for="entry in day.entries"
          :key="entry.id"
        >
          <TimelineGroup
            v-if="entry.kind === 'bot-group' || entry.kind === 'ci-group'"
            :group="entry"
            :viewer="viewer"
            :subject="subject"
          />
          <TimelineEntry
            v-else
            :event="entry"
            :viewer="viewer"
            :subject="subject"
          />
        </template>
      </ul>
    </section>
    <p
      v-if="truncated"
      class="tl-truncated"
    >
      {{ copy.preview.truncated }}
      ·
      <a
        class="card-link"
        :href="originalUrl"
        target="_blank"
        rel="noreferrer"
        >{{ copy.preview.source }}</a
      >
    </p>
  </div>
</template>

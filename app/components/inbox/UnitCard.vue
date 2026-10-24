<script setup lang="ts">
import type { UnitView } from '#shared/unit'
import { copy } from '~/copy/en'
import { boardLabel, markLabel, stateLabel, tagLabel } from '~/utils/category'
import { issueStatus, reasonText } from '~/utils/reason'
import { absoluteDay, relativeAge, waitingAge } from '~/utils/time'

const props = defineProps<{
  unit: UnitView
  size: 'large' | 'row' | 'small'
  selected?: boolean
  index?: number
}>()

const emit = defineEmits<{
  select: []
  menu: [event: MouseEvent]
}>()

const line = computed(() => {
  if (props.unit.reasonCode === 'clef' && props.unit.quote) return props.unit.quote
  return reasonText(props.unit.reasonCode, props.unit.reasonActor)
})

const metaTime = computed(() =>
  props.size === 'small' ? waitingAge(props.unit.ageMs) : relativeAge(props.unit.ageMs),
)

const endedWhen = computed(() =>
  props.unit.closedAt ? absoluteDay(props.unit.closedAt) : relativeAge(props.unit.ageMs),
)

const time = computed(() => (props.unit.ended ? endedWhen.value : metaTime.value))
const issueOnly = computed(() => props.unit.kind === 'issue-only')
const tone = computed(() =>
  props.size === 'small' && !props.unit.ended && props.unit.tone !== 'none'
    ? props.unit.tone
    : undefined,
)

const status = computed(() => {
  if (props.unit.ended) return stateLabel(props.unit.state)
  return issueOnly.value ? issueStatus(props.unit.reasonCode) : line.value
})

const hasNotes = computed(
  () =>
    (issueOnly.value && !props.unit.fixedBy) ||
    props.unit.tags.length > 0 ||
    props.unit.marks.length > 0 ||
    props.unit.labels.length > 0 ||
    Boolean(props.unit.fixedBy) ||
    props.unit.issues.length > 0,
)
</script>

<template>
  <article
    class="unit-card"
    :class="[size, { issue: issueOnly, selected }]"
    :data-unit="unit.id"
    :style="{ '--i': Math.min(index ?? 0, 10) }"
    @click="emit('select')"
    @contextmenu.prevent="emit('menu', $event)"
  >
    <template v-if="size === 'small'">
      <p class="unit-id">
        <UnreadDot v-if="unit.unread" />
        <span class="unit-repo">{{ unit.repo }}</span>
        <span class="unit-number"
          ><template v-if="issueOnly">{{ copy.issuePrefix }} </template>#{{ unit.number }}</span
        >
      </p>
      <h3 class="unit-title">{{ unit.title }}</h3>
      <p class="unit-status">{{ status }}</p>
      <p
        class="unit-age"
        :class="tone"
        >{{ time }}</p
      >
    </template>
    <template v-else>
      <CardMeta
        :repo="unit.repo"
        :number="unit.number"
        :issue="issueOnly"
        :time="time"
        :unread="unit.unread"
      />
      <h3 class="card-title">{{ unit.title }}</h3>
      <p
        class="card-reason"
        :class="{ mine: size === 'large' && unit.myTurn }"
        >{{ line }}</p
      >
      <p
        v-if="size === 'large' && hasNotes"
        class="card-notes"
      >
        <span v-if="issueOnly && !unit.fixedBy">{{ copy.noPr }}</span>
        <span
          v-for="tag in unit.tags"
          :key="tag"
          >{{ tagLabel(tag) }}</span
        >
        <span
          v-for="mark in unit.marks"
          :key="mark"
          >{{ markLabel(mark) }}</span
        >
        <span
          v-for="label in unit.labels"
          :key="label"
          >{{ boardLabel(label) }}</span
        >
        <a
          v-if="unit.fixedBy"
          class="card-fixed"
          :href="unit.fixedBy.url"
          target="_blank"
          rel="noreferrer"
          @click.stop
          >{{ copy.fixedBy(unit.fixedBy.authorLogin, unit.fixedBy.number) }}</a
        >
        <span
          v-for="issue in unit.issues"
          :key="issue.url"
          >{{ copy.related(issue.number) }}</span
        >
      </p>
    </template>
  </article>
</template>

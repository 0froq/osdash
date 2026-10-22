<script setup lang="ts">
import type { UnitView } from '#shared/unit'
import { copy } from '~/copy/zh-CN'
import { boardLabel, markLabel, stateLabel, tagLabel } from '~/utils/category'
import { reasonText, waitingOn } from '~/utils/reason'
import { absoluteDay, relativeAge, waitingAge } from '~/utils/time'

const props = defineProps<{
  unit: UnitView
  size: 'large' | 'row' | 'small'
  selected?: boolean
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
</script>

<template>
  <article
    class="unit-card"
    :class="[size, { dashed: unit.kind === 'issue-only', selected }]"
    :data-unit="unit.id"
    @click="emit('select')"
    @contextmenu.prevent="emit('menu', $event)"
  >
    <CardMeta
      :repo="unit.repo"
      :number="size === 'large' ? null : unit.number"
      :time="unit.ended ? endedWhen : metaTime"
      :unread="unit.unread"
      :tone="size === 'small' && !unit.ended ? unit.tone : undefined"
    />
    <p
      v-if="size === 'large'"
      class="card-reason"
      >{{ line }}</p
    >
    <h3 class="card-title">
      <span
        v-if="unit.kind === 'issue-only'"
        class="issue-prefix"
        >{{ copy.issuePrefix }}</span
      >
      <span class="card-number">#{{ unit.number }}</span>
      {{ unit.title }}
    </h3>
    <p
      v-if="size === 'row'"
      class="card-summary"
      >{{ line }}</p
    >
    <p
      v-else-if="size === 'small' && unit.ended"
      class="card-summary"
      >{{ stateLabel(unit.state) }}</p
    >
    <p
      v-else-if="size === 'small'"
      class="card-summary"
      >{{ waitingOn(unit.reasonCode, unit.kind) }}</p
    >
    <div
      v-if="size === 'large'"
      class="card-detail"
    >
      <p
        v-if="unit.kind === 'issue-only' && !unit.fixedBy"
        class="card-note"
        >{{ copy.noPr }}</p
      >
      <a
        v-if="unit.fixedBy"
        class="card-link"
        :href="unit.fixedBy.url"
        target="_blank"
        rel="noreferrer"
        @click.stop
      >
        {{ copy.fixedBy(unit.fixedBy.authorLogin, unit.fixedBy.number) }}
      </a>
      <p
        v-for="issue in unit.issues"
        :key="issue.url"
        class="card-note"
      >
        {{ copy.related(issue.number) }}
      </p>
      <p
        v-if="unit.tags.length || unit.marks.length || unit.labels.length"
        class="card-chips"
      >
        <span
          v-for="tag in unit.tags"
          :key="tag"
          class="chip"
          >{{ tagLabel(tag) }}</span
        >
        <span
          v-for="mark in unit.marks"
          :key="mark"
          class="chip"
          >{{ markLabel(mark) }}</span
        >
        <span
          v-for="label in unit.labels"
          :key="label"
          class="chip"
          >{{ boardLabel(label) }}</span
        >
      </p>
    </div>
  </article>
</template>

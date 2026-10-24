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

<style scoped>
.unit-card {
  position: relative;
  min-width: 0;
  padding: 14px 12px;
  border-radius: var(--radius-row);
  cursor: pointer;
  transition: background-color var(--dur-1) var(--ease);
}

.unit-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 12px;
  left: 12px;
  height: 1px;
  background: var(--line);
  transition: opacity var(--dur-1) var(--ease);
}

.unit-card:first-of-type::before {
  display: none;
}

.unit-card:hover::before,
.unit-card:hover + .unit-card::before,
.unit-card.selected::before,
.unit-card.selected + .unit-card::before {
  opacity: 0;
}

.unit-card:hover {
  background: var(--soft);
}

.unit-card.selected,
.unit-card.selected:hover {
  background: var(--soft-2);
  box-shadow: inset 2px 0 0 var(--fg);
}

[data-intro] .unit-card {
  animation: row-in var(--dur-3) var(--ease) both;
  animation-delay: calc(var(--i, 0) * 24ms);
}

.card-title {
  display: -webkit-box;
  margin-top: 6px;
  overflow: hidden;
  font-size: 15.5px;
  line-height: 1.4;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-reason {
  margin-top: 4px;
  color: color-mix(in oklab, var(--fg) 80%, transparent);
  font-size: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.card-reason.mine {
  color: var(--accent);
}

.card-notes {
  margin-top: 6px;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.card-notes > * + *::before {
  content: '·';
  margin: 0 6px;
}

.card-fixed:hover {
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.unit-card.small {
  display: grid;
  grid-template-areas: 'id title status age';
  grid-template-columns: 180px minmax(0, 1fr) auto 3.5em;
  column-gap: 14px;
  align-items: center;
  padding: 11px 12px;
}

.unit-id {
  display: flex;
  grid-area: id;
  gap: 6px;
  align-items: center;
  min-width: 0;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11.5px;
}

.unit-repo {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit-number {
  flex: 0 0 auto;
  white-space: nowrap;
}

.unit-title {
  grid-area: title;
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit-status {
  grid-area: status;
  max-width: 220px;
  overflow: hidden;
  color: var(--muted);
  font-size: 12.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit-age {
  grid-area: age;
  font-family: var(--font-meta);
  color: var(--muted);
  font-size: 11.5px;
  text-align: right;
  white-space: nowrap;
}

.unit-age.yellow {
  color: var(--warn);
}

.unit-age.red {
  color: var(--accent);
}

@media (max-width: 760px) {
  .unit-card {
    padding: 14px 4px;
  }

  .unit-card::before {
    right: 4px;
    left: 4px;
  }

  .unit-card.small {
    grid-template-areas:
      'id status age'
      'title title title';
    grid-template-columns: minmax(0, 1fr) auto auto;
    row-gap: 4px;
    padding: 14px 4px;
  }

  .unit-age {
    min-width: 3em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .unit-card {
    animation: none;
  }
}

@keyframes row-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}
</style>

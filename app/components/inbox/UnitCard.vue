<script setup lang="ts">
import type { UnitView } from '#shared/unit'
import { copy } from '~/copy/en'
import { boardLabel, markLabel, stateLabel, tagLabel } from '~/utils/category'
import { issueStatus, reasonText } from '~/utils/reason'
import { absoluteDay, relativeAge } from '~/utils/time'

const props = defineProps<{
  unit: UnitView
  viewer: string
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

const endedWhen = computed(() =>
  props.unit.closedAt ? absoluteDay(props.unit.closedAt) : relativeAge(props.unit.ageMs),
)

const time = computed(() => (props.unit.ended ? endedWhen.value : relativeAge(props.unit.ageMs)))

const issueOnly = computed(() => props.unit.kind === 'issue-only')

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
    :class="{ issue: issueOnly, selected, mine: unit.myTurn, unread: unit.unread }"
    :data-unit="unit.id"
    :style="{ '--i': Math.min(index ?? 0, 10) }"
    @click="emit('select')"
    @contextmenu.prevent="emit('menu', $event)"
  >
    <div class="card-info">
      <span class="card-kicker">
        <KindIcon
          :kind="issueOnly ? 'issue' : 'pr'"
          :unread="unit.unread"
        />
        <span>{{ unit.repo }}</span>
        <span>#{{ unit.number }}</span>
      </span>
      <h3 class="card-title">
        <button
          class="card-open"
          type="button"
          :aria-pressed="Boolean(selected)"
          @click.stop="emit('select')"
          ><span class="card-mark">{{ unit.title }}</span></button
        >
      </h3>
      <p class="card-meta"
        ><span class="card-status">{{ status }}</span
        ><span class="card-when">{{ time }}</span></p
      >
      <p
        v-if="hasNotes"
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
    </div>
    <CardTimeline
      class="card-rail"
      :unit="unit"
      :viewer="viewer"
    />
  </article>
</template>

<style scoped>
.unit-card {
  position: relative;
  display: grid;
  /* Only the information column contributes to the card's height. */
  /* Match the panel's 404px content width (460px minus 28px on each side),
     plus this column's 16px inset and 1px divider. Leave room for the title. */
  grid-template-columns: minmax(0, 1fr) minmax(0, min(421px, 58%));
  align-items: start;
  width: 100%;
  min-width: 0;
  gap: 7px 32px;
  margin-inline: -14px;
  padding: 16px 20px 16px;
  border-radius: 4px;
  cursor: pointer;
  /* At rest a sheet is only a hairline. The shadow is reserved for the sheet
     under the pointer, so a list of ten never looks like ten lifted cards. */
  box-shadow: 0 0 0 1px var(--line);
  transition:
    background-color var(--dur-2) var(--ease),
    box-shadow var(--dur-2) var(--ease);
}

.unit-card {
  --st-paper: var(--bg);
}

.unit-card.mine {
  background: var(--card);
  --st-paper: var(--card);
}

.unit-card.unread {
  box-shadow: 0 0 0 1px var(--accent);
}

.unit-card:not(.mine) {
  padding-block: 13px;
}

.card-info {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  align-items: baseline;
}

.card-rail {
  contain: size;
  align-self: stretch;
  min-height: 0;
  padding-left: 16px;
  border-left: 1px solid var(--line);
}

.unit-card:not(.mine):hover {
  background: color-mix(in oklab, var(--fg) 2.5%, transparent);
  --st-paper: color-mix(in oklab, var(--fg) 2.5%, var(--bg));
}

.unit-card:hover,
.unit-card:has(.card-open:focus-visible) {
  box-shadow:
    0 1px 1px color-mix(in oklab, var(--fg) 6%, transparent),
    0 14px 30px -20px color-mix(in oklab, var(--fg) 34%, transparent),
    0 0 0 1px color-mix(in oklab, var(--fg) 24%, var(--line));
}

.unit-card.selected {
  box-shadow:
    0 1px 1px color-mix(in oklab, var(--fg) 7%, transparent),
    0 14px 30px -20px color-mix(in oklab, var(--fg) 36%, transparent),
    0 0 0 1px var(--fg);
}

.card-kicker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 10px;
  line-height: 1.5;
  letter-spacing: 0.03em;
}

.card-title {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 400;
  line-height: 1.32;
  letter-spacing: -0.005em;
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

.unit-card:not(.mine) .card-title {
  font-size: 17px;
}

.card-status,
.card-when {
  white-space: nowrap;
}

.card-status {
  color: var(--muted);
  font-size: 11.5px;
}

.unit-card.mine .card-status {
  color: var(--accent);
}

.card-when {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

/* Project-specific context stays below the demo's contribution column. */
.card-notes {
  display: flex;
  grid-column: 1;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.5;
}

.card-notes > * {
  max-width: 100%;
  padding: 3px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  overflow-wrap: anywhere;
}

.card-fixed:hover {
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.card-open {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.card-open:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 3px;
}

@media (max-width: 780px) {
  .unit-card {
    column-gap: 16px;
    margin-inline: 0;
    padding: 15px 16px 14px;
  }

  .card-title,
  .unit-card:not(.mine) .card-title {
    font-size: 16px;
  }

  .card-rail {
    padding-left: 12px;
  }
}
</style>

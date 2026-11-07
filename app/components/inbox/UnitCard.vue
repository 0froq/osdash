<script setup lang="ts">
import type { UnitView } from '#shared/unit'
const { t } = useI18n()
import { stateLabel } from '~/utils/category'
import { absoluteDay, relativeAge } from '~/utils/time'

const props = defineProps<{
  unit: UnitView
  viewer: string
  selected?: boolean
  index?: number
  /** Timestamp this card is snoozed until; absent means it is not marked later. */
  laterAt?: number
}>()

const emit = defineEmits<{
  select: []
  menu: [event: MouseEvent]
}>()

const endedWhen = computed(() =>
  props.unit.closedAt ? absoluteDay(props.unit.closedAt) : relativeAge(t, props.unit.ageMs),
)

const activeAge = computed(() => {
  const at = props.unit.lastOwnActivityAt
  const parsed = at ? Date.parse(at) : Number.NaN
  const age = Number.isNaN(parsed) ? props.unit.ageMs : Date.now() - parsed
  return relativeAge(t, Math.max(0, age))
})

const issueOnly = computed(() => props.unit.kind === 'issue-only')
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
      <p
        v-if="unit.ended"
        class="card-meta"
        ><span class="card-status">{{ stateLabel(t, unit.state) }}</span
        ><span class="card-when">{{ endedWhen }}</span></p
      >
      <p
        v-else
        class="card-meta"
      >
        <span class="card-when">{{ t('activeFor', { age: activeAge }) }}</span>
      </p>
      <UnitTags
        :unit="unit"
        :later-at="laterAt"
      />
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
  border-radius: var(--ui-radius);
  cursor: pointer;
  /* The card is a 1px ring drawn outside its box, like the old shadow ring but
     with a line style: solid when we have a PR, dashed when there is only an
     issue. Hover, unread and selected change its color. */
  outline: 1px solid var(--line);
  transition:
    background-color var(--dur-2) var(--ease),
    outline-color var(--dur-2) var(--ease);
}

.unit-card.issue {
  outline-style: dashed;
}

.unit-card {
  --st-paper: var(--bg);
}

.unit-card.unread {
  outline-color: var(--accent);
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

.unit-card:hover {
  background: color-mix(in oklab, var(--fg) 2.5%, transparent);
  --st-paper: color-mix(in oklab, var(--fg) 2.5%, var(--bg));
}

.unit-card:hover,
.unit-card:has(.card-open:focus-visible) {
  outline-color: color-mix(in oklab, var(--fg) 24%, var(--line));
}

.unit-card.unread:hover,
.unit-card.unread:has(.card-open:focus-visible) {
  outline-color: var(--accent);
}

.unit-card.selected {
  outline-color: var(--fg);
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

/* The rail wants about 420px of its own. When the list column is narrower than
   that plus the info column (docked preview, tablet, phone), hide the rail
   and keep only the meta. The card keeps its -14px inline margin: the hairline
   ring is a box-shadow outside the card, and Collapsible clips its body flush
   at the right edge, so a card pinned to that edge loses its right ring. */
@container inbox (max-width: 740px) {
  .unit-card {
    grid-template-columns: minmax(0, 1fr);
    padding: 15px 16px 14px;
  }

  .card-rail {
    display: none;
  }
}

@media (max-width: 780px) {
  .card-title,
  .unit-card:not(.mine) .card-title {
    font-size: 16px;
  }
}
</style>

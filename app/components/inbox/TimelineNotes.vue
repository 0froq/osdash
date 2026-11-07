<script setup lang="ts">
import { computed } from 'vue'
import { noteKey } from '#shared/device-relay'
import type { UnitNote } from '#shared/unit'

/** The note being dragged, owned by the timeline. */
export type NoteDrag = {
  key: string
  /** The row the note came from. */
  from: string
  /** The row it would land under. */
  target: string
  /**
   * Position among the target row's notes, not counting the lifted card, the
   * note would take if dropped now.
   */
  insertIndex: number
  height: number
  width: number
}

const props = defineProps<{
  /** The row these notes sit under. It names the drop slot in front of them. */
  rowId: string
  notes: UnitNote[]
  /** Whether notes can be edited and moved at all. */
  editable: boolean
  editableIds?: string[]
  drag: NoteDrag | null
  /**
   * This frame the gap is inserted or removed with no height animation: at the
   * start of a drag it must already be the card's size, and at the end the
   * card takes its place.
   */
  release?: boolean
}>()

const emit = defineEmits<{
  save: [id: string, payload: { text: string; version: string | null }]
  remove: [id: string]
  cancel: [id: string]
  dragStart: [id: string, event: PointerEvent]
  dragMove: [y: number]
  dragEnd: [commit: boolean]
  nudge: [id: string, step: -1 | 1]
}>()

function canEdit(note: UnitNote): boolean {
  return (
    props.editable && note.writable !== false && Boolean(props.editableIds?.includes(noteKey(note)))
  )
}

/** Notes still in the flow. The lifted card is drawn on its own, out of this list. */
const flow = computed(() => props.notes.filter(note => noteKey(note) !== props.drag?.key))

/** Where the gap is open in this row, or -1 while the drag is aimed elsewhere. */
const gapIndex = computed(() =>
  props.editable && props.drag?.target === props.rowId ? props.drag.insertIndex : -1,
)

/** The lifted card, rendered by the row it came from so it keeps that row's width. */
const lifted = computed(() =>
  props.drag?.from === props.rowId
    ? props.notes.find(note => noteKey(note) === props.drag?.key)
    : undefined,
)

const gapStyle = computed(() => (props.drag ? { '--gap-h': `${props.drag.height}px` } : undefined))

/**
 * One gap at `gapIndex`, with a stable key. Within a row it moves and the notes
 * slide apart. Across rows the old one closes and the new one opens by height,
 * the same push the rows below follow. The lifted card is not in this list.
 */
const items = computed(() => {
  const out: Array<{ kind: 'gap' } | { kind: 'note'; note: UnitNote }> = []
  flow.value.forEach((note, index) => {
    if (gapIndex.value === index) out.push({ kind: 'gap' })
    out.push({ kind: 'note', note })
  })
  if (gapIndex.value >= 0 && gapIndex.value >= flow.value.length) out.push({ kind: 'gap' })
  return out
})

function itemKey(item: { kind: 'gap' } | { kind: 'note'; note: UnitNote }): string {
  return item.kind === 'gap' ? `gap-${props.rowId}` : noteKey(item.note)
}
</script>

<template>
  <!-- Measured once when a drag starts: one insertion point of this row. -->
  <span
    v-if="editable"
    class="note-slot"
    :data-slot="rowId"
    aria-hidden="true"
  />
  <TransitionGroup
    tag="div"
    name="note-list"
    class="note-list"
    :css="!release"
  >
    <template
      v-for="item in items"
      :key="itemKey(item)"
    >
      <div
        v-if="item.kind === 'gap'"
        class="note-gap"
        :style="gapStyle"
        aria-hidden="true"
      />
      <div
        v-else
        class="note-shell"
      >
        <div class="note-shell-in">
          <NoteCard
            :note="item.note"
            :editable="canEdit(item.note)"
            :movable="canEdit(item.note)"
            @save="emit('save', noteKey(item.note), $event)"
            @remove="emit('remove', noteKey(item.note))"
            @cancel="emit('cancel', noteKey(item.note))"
            @drag-start="emit('dragStart', noteKey(item.note), $event)"
            @drag-move="emit('dragMove', $event)"
            @drag-end="emit('dragEnd', $event)"
            @nudge="emit('nudge', noteKey(item.note), $event)"
          />
        </div>
      </div>
    </template>
  </TransitionGroup>
  <!--
    Outside the TransitionGroup. Inside it, the group's FLIP runs on every
    reorder and writes a transform that fights the pointer.
  -->
  <NoteCard
    v-if="lifted"
    :note="lifted"
    :editable="canEdit(lifted)"
    :movable="canEdit(lifted)"
    dragging
    @save="emit('save', noteKey(lifted), $event)"
    @remove="emit('remove', noteKey(lifted))"
    @cancel="emit('cancel', noteKey(lifted))"
    @drag-start="emit('dragStart', noteKey(lifted), $event)"
    @drag-move="emit('dragMove', $event)"
    @drag-end="emit('dragEnd', $event)"
    @nudge="emit('nudge', noteKey(lifted), $event)"
  />
</template>

<style scoped>
.note-slot {
  display: block;
  height: 0;
}

/* The room the note will take, margins included. Opening and closing is a
   height change, which pushes the rows below. Moving within a row is a
   transform, so the notes slide instead of the height being measured again. */
.note-gap {
  box-sizing: border-box;
  height: var(--gap-h, 0);
  margin: 8px 0 12px;
  border: 1px dashed var(--accent);
  border-radius: var(--ui-radius);
  transition: height var(--dur-2) var(--ease);
}

/* Within a row the gap moves and the notes slide. The transform is the whole
   move: the gap stays full height, so nothing is measured mid-animation. */
.note-list-move {
  transition: transform var(--dur-2) var(--ease);
}

.note-list-enter-active,
.note-list-leave-active {
  overflow: hidden;
  transition:
    height var(--dur-2) var(--ease),
    margin var(--dur-2) var(--ease),
    border-width var(--dur-2) var(--ease),
    opacity var(--dur-2) var(--ease),
    grid-template-rows var(--dur-2) var(--ease);
}

.note-list-enter-from,
.note-list-leave-to {
  height: 0;
  margin: 0;
  border-width: 0;
  opacity: 0;
}

/* A note grows in and folds away. The grid row is what the list below follows.
   Dragging skips this transition, so the lifted card is not squashed. */
.note-shell {
  display: grid;
  grid-template-rows: 1fr;
}

.note-shell-in {
  min-height: 0;
  overflow: hidden;
}

.note-list-enter-from.note-shell,
.note-list-leave-to.note-shell {
  height: auto;
  grid-template-rows: 0fr;
}

@media (prefers-reduced-motion: reduce) {
  .note-gap,
  .note-list-move,
  .note-list-enter-active,
  .note-list-leave-active {
    transition: none;
  }
}
</style>

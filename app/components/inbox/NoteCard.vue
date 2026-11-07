<script setup lang="ts">
import type { UnitNote } from '#shared/unit'
import { IconButton } from '@froq/ui'
import { absoluteTime } from '~/utils/time'

const { t } = useI18n()

const props = defineProps<{
  note: UnitNote
  editable?: boolean
  /** The parent is moving this note: it follows the pointer and lifts off the page. */
  dragging?: boolean
  /** Whether the note can be moved at all; the parent owns where it lands. */
  movable?: boolean
}>()

const emit = defineEmits<{
  save: [payload: { text: string; version: string | null }]
  remove: []
  cancel: []
  dragStart: [event: PointerEvent]
  dragMove: [y: number]
  dragEnd: [commit: boolean]
  nudge: [step: -1 | 1]
}>()

// A freshly created note arrives empty, so it opens straight into the field.
const editing = ref(Boolean(props.editable) && props.note.text.length === 0)
const draft = ref(props.note.text)
const draftVersion = ref(props.note.version ?? null)
const field = ref<HTMLTextAreaElement>()
const root = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)
const bodyIn = ref<HTMLElement | null>(null)
const bodyHeight = ref<number | null>(null)
const bodyMotion = ref(false)
let bodyObserver: ResizeObserver | null = null
let heightFrame = 0
const canSave = computed(() => Boolean(props.editable) && draft.value.trim().length > 0)

/**
 * The body's pixel height, including the text's top margin. Measuring the inner
 * box drops that margin, and the locked height then clips the line.
 */
function lockHeight(): void {
  const outer = body.value
  if (!outer) return
  const bound = bodyHeight.value
  outer.style.height = 'auto'
  const next = Math.ceil(outer.getBoundingClientRect().height)
  if (bound === null || !bodyMotion.value || Math.abs(bound - next) < 1) {
    bodyHeight.value = next
    return
  }
  outer.style.height = `${bound}px`
  void outer.offsetHeight
  cancelAnimationFrame(heightFrame)
  heightFrame = requestAnimationFrame(() => {
    bodyHeight.value = next
  })
}

const when = computed(() => absoluteTime(props.note.anchor))

/**
 * The grip moves the note by pointer: the parent turns the pointer position
 * into a row. Capturing the pointer keeps the move going when it leaves the grip.
 */
const gripping = ref(false)

function onGripDown(event: PointerEvent): void {
  if (!props.movable || editing.value || event.button !== 0) return
  // Without this the drag starts selecting text instead.
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  gripping.value = true
  emit('dragStart', event)
}

function onGripMove(event: PointerEvent): void {
  if (gripping.value) emit('dragMove', event.clientY)
}

function onGripUp(): void {
  if (!gripping.value) return
  gripping.value = false
  emit('dragEnd', true)
}

function onGripCancel(): void {
  if (!gripping.value) return
  gripping.value = false
  emit('dragEnd', false)
}

/** The same move without a pointer: one step up or down the story. */
function onGripKey(event: KeyboardEvent): void {
  if (!props.movable || editing.value) return
  if (event.key === 'Escape' && gripping.value) {
    onGripCancel()
    return
  }
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
  event.preventDefault()
  emit('nudge', event.key === 'ArrowUp' ? -1 : 1)
}

function start(): void {
  if (!props.editable || editing.value) return
  draft.value = props.note.text
  draftVersion.value = props.note.version ?? null
  editing.value = true
  void nextTick(() => field.value?.focus())
}

function commit(): void {
  if (!canSave.value) return
  emit('save', { text: draft.value.trim(), version: draftVersion.value })
  editing.value = false
}

function cancel(): void {
  draft.value = props.note.text
  editing.value = false
  // An empty note was never saved, so the caller drops it.
  if (props.note.text.length === 0) emit('cancel')
}

function onPointerDown(event: PointerEvent): void {
  if (!editing.value) return
  const target = event.target
  if (target instanceof Node && root.value?.contains(target)) return
  cancel()
}

watch(editing, value => {
  if (value) window.addEventListener('pointerdown', onPointerDown, true)
  else window.removeEventListener('pointerdown', onPointerDown, true)
  void nextTick(lockHeight)
})

onMounted(() => {
  lockHeight()
  const inner = bodyIn.value
  if (inner) {
    bodyObserver = new ResizeObserver(() => lockHeight())
    bodyObserver.observe(inner)
  }
  requestAnimationFrame(() => {
    bodyMotion.value = true
  })
  if (editing.value) {
    window.addEventListener('pointerdown', onPointerDown, true)
    void nextTick(() => field.value?.focus())
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onPointerDown, true)
  bodyObserver?.disconnect()
  cancelAnimationFrame(heightFrame)
})

function onKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    cancel()
    return
  }
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    commit()
  }
}
</script>

<template>
  <article
    ref="root"
    class="note"
    :class="{
      'is-draft': editing,
      'is-unsaved': note.unsaved && !editing,
      'is-dragging': dragging,
    }"
  >
    <header class="note-head">
      <span
        class="note-mark"
        aria-hidden="true"
      />
      <span class="note-label">{{ t('note.label') }}</span>
      <span
        v-if="note.writable === false"
        class="note-state"
        >{{ t('notes.readonly') }}</span
      >
      <time
        class="note-where"
        :datetime="note.anchor"
        >{{ when }}</time
      >
      <span
        v-if="editable"
        class="note-actions"
      >
        <IconButton
          v-if="movable"
          class="note-icon note-grip"
          :label="t('note.move')"
          :title="t('note.drag')"
          :frame="false"
          @pointerdown="onGripDown"
          @pointermove="onGripMove"
          @pointerup="onGripUp"
          @pointercancel="onGripCancel"
          @keydown="onGripKey"
        >
          <template #icon>
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <circle
                cx="9"
                cy="6"
                r="1.4"
              />
              <circle
                cx="15"
                cy="6"
                r="1.4"
              />
              <circle
                cx="9"
                cy="12"
                r="1.4"
              />
              <circle
                cx="15"
                cy="12"
                r="1.4"
              />
              <circle
                cx="9"
                cy="18"
                r="1.4"
              />
              <circle
                cx="15"
                cy="18"
                r="1.4"
              />
            </svg>
          </template>
        </IconButton>
        <IconButton
          class="note-icon"
          :label="t('note.edit')"
          :title="t('note.edit')"
          :frame="false"
          :action="start"
        >
          <template #icon>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
              <path d="M14.5 6.5 17.5 9.5" />
            </svg>
          </template>
        </IconButton>
        <IconButton
          class="note-icon note-remove"
          :label="t('note.remove')"
          :title="t('note.remove')"
          :frame="false"
          :action="() => emit('remove')"
        >
          <template #icon>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 7h16" />
              <path d="M10 11v6M14 11v6" />
              <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
              <path d="M9 7V4h6v3" />
            </svg>
          </template>
        </IconButton>
      </span>
    </header>
    <div
      ref="body"
      class="note-body"
      :class="{ 'is-motion': bodyMotion }"
      :style="bodyHeight === null ? undefined : { height: `${bodyHeight}px` }"
    >
      <div ref="bodyIn">
        <template v-if="editing">
          <textarea
            ref="field"
            v-model="draft"
            class="note-field"
            rows="3"
            :aria-label="t('note.label')"
            :placeholder="t('note.placeholder')"
            :disabled="!editable"
            @keydown="onKey"
          />
          <p class="note-foot">
            <button
              type="button"
              class="note-confirm"
              :disabled="!canSave"
              @click="commit"
            >
              {{ t('note.save') }}
            </button>
          </p>
        </template>
        <MarkdownBody
          v-else
          class="note-text"
          :source="note.text"
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
/* Registered so the border segment can turn. Without this the angle jumps. */
@property --note-spin {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

/* A note is yours, not an event, so it is drawn as a quiet sheet: a hairline
   frame and no fill. Solid once it is saved, dashed while it is still a draft,
   the same line the site uses for what is not done yet. */
.note {
  margin: 8px 0 12px;
  padding: 10px 12px 12px;
  border: 1px solid var(--line);
  border-radius: var(--ui-radius);
  transition: border-color var(--dur-2) var(--ease);
}

.note-body {
  display: flow-root;
}

.note-body.is-motion {
  overflow: hidden;
  transition: height var(--dur-2) var(--ease);
}

.note.is-draft {
  border-style: dashed;
}

.note.is-unsaved {
  position: relative;
  border-color: transparent;
}

/* The accent segment travels clockwise around the frame. Only the angle moves;
   rotating the element would spin the rounded rectangle off the card. */
.note.is-unsaved::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: var(--ui-radius);
  padding: 1px;
  background: conic-gradient(
    from var(--note-spin),
    var(--line) 0deg,
    var(--line) 320deg,
    var(--accent) 345deg,
    var(--line) 360deg
  );
  pointer-events: none;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  animation: note-unsaved 1.4s linear infinite;
}

@keyframes note-unsaved {
  to {
    --note-spin: 360deg;
  }
}

.note-head {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px 10px;
  align-items: center;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 10.5px;
  letter-spacing: 0.02em;
  line-height: 1.5;
}

/* The capsule Pick, Sidebar and Tags draw: accent marks what is yours. */
.note-mark {
  flex: none;
  width: 3px;
  height: 10px;
  border-radius: 1px;
  background: var(--accent);
}

.note-label {
  flex: none;
  color: var(--fg);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.note-state {
  flex: none;
}

.note-where {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.note-actions {
  display: inline-flex;
  flex: none;
  gap: 2px;
  align-items: center;
  margin-inline-start: auto;
}

/* Same quiet icon buttons as the preview header: bare, a soft wash on hover. */
.note-icon.ui-icon-button {
  width: 24px;
  height: 24px;
  border-radius: var(--ui-radius);
  color: var(--muted);
  transition:
    color var(--dur-1) var(--ease),
    background-color var(--dur-1) var(--ease);
}

.note-icon.ui-icon-button:hover:not(:disabled),
.note-icon.ui-icon-button:focus-visible {
  background: var(--soft);
  color: var(--fg);
}

.note-actions .note-remove.ui-icon-button:hover:not(:disabled) {
  color: var(--accent);
}

.note-icon :deep(svg) {
  width: 14px;
  height: 14px;
}

/* touch-action keeps a finger drag from scrolling the page instead. */
.note-grip {
  cursor: grab;
  touch-action: none;
}

.note.is-dragging .note-grip {
  cursor: grabbing;
}

/* Lifted out of the list, so the list can animate without this card in it.
   The timeline pins it with the three variables; it is not part of the
   TransitionGroup, whose FLIP would fight the pointer every frame. */
.note.is-dragging {
  position: absolute;
  z-index: 4;
  top: var(--note-drag-top, 0);
  left: var(--note-drag-left, 0);
  width: var(--note-drag-width, auto);
  box-sizing: border-box;
  margin: 0;
  border-style: solid;
  border-color: var(--accent);
  background: var(--bg);
  user-select: none;
  transition: none;
}

.note-text {
  margin-top: 8px;
  font-size: 13.5px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.note-field {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: var(--ui-radius);
  background: none;
  color: var(--fg);
  font: inherit;
  font-size: 13.5px;
  line-height: 1.55;
  outline: none;
  resize: vertical;
  transition: border-color var(--dur-1) var(--ease);
}

.note-field::placeholder {
  color: var(--muted);
  opacity: 1;
}

.note-field:focus {
  border-color: var(--fg);
}

.note-field:disabled {
  color: var(--muted);
}

.note-foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.note-confirm {
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-meta);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.note-confirm:hover:not(:disabled),
.note-confirm:focus-visible {
  color: var(--fg);
}

.note-confirm:disabled {
  color: var(--muted);
  cursor: default;
  opacity: 0.45;
}

@media (prefers-reduced-motion: reduce) {
  .note,
  .note-body.is-motion {
    transition: none;
  }

  .note.is-unsaved {
    border-color: var(--accent);
  }

  .note.is-unsaved::before {
    content: none;
  }
}
</style>

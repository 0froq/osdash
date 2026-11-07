<script setup lang="ts">
import type { UnitNote, UnitView } from '#shared/unit'
import { Paper } from '@froq/ui'
const { t } = useI18n()

const props = defineProps<{
  unit: UnitView | null
  viewer: string
  /** First load: keep the empty panel blank instead of prompting for a card. */
  loading?: boolean
  mobile: boolean
  /** True when the preview covers the list (phone sheet or tablet overlay). */
  backdrop: boolean
  notes?: UnitNote[]
  notesEditable?: boolean
  editableNoteIds?: string[]
  noteError?: string
  /** What the header's note button does until notes can be edited. */
  noteMode?: 'add' | 'loading' | 'connect' | 'refresh' | 'retry'
  /** Timestamp this unit is snoozed until; absent means it is not marked later. */
  laterAt?: number
}>()

const emit = defineEmits<{
  close: []
  noteAdd: []
  later: [at: number]
  clearLater: []
  noteSave: [payload: { id: string; text: string; version: string | null }]
  noteMove: [payload: { id: string; anchor: string }]
  noteDelete: [id: string]
  noteCancel: [id: string]
  deviceSettings: []
  notesReload: []
}>()

const timeline = useTimeline()
const drag = ref(0)
const closing = ref(false)
let startY = 0
let dragging = false

watch(
  () => props.unit?.id,
  id => {
    drag.value = 0
    if (!id) {
      timeline.clear()
      return
    }
    void timeline.load(id)
  },
  { immediate: true },
)

watch(
  () => Boolean(props.unit) && props.mobile,
  locked => {
    if (!import.meta.client) return
    document.body.style.overflow = locked ? 'hidden' : ''
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

function onDown(event: PointerEvent): void {
  if (!props.mobile) return
  dragging = true
  startY = event.clientY
}

function onMove(event: PointerEvent): void {
  if (!dragging) return
  drag.value = Math.max(0, event.clientY - startY)
}

function onUp(): void {
  if (!dragging) return
  dragging = false
  if (drag.value > 80) {
    emit('close')
    return
  }
  drag.value = 0
}
</script>

<template>
  <div
    class="preview-root"
    :class="{ open: unit !== null || closing, sheet: mobile }"
  >
    <Transition name="mask">
      <button
        v-if="unit && backdrop"
        class="preview-mask"
        type="button"
        :aria-label="t('preview.close')"
        @click="emit('close')"
      />
    </Transition>
    <Transition
      :name="mobile ? 'sheet' : 'slide'"
      appear
      @before-leave="closing = true"
      @after-leave="closing = false"
    >
      <aside
        v-if="unit || !backdrop"
        class="preview"
        :style="drag ? { '--drag': `${drag}px` } : undefined"
      >
        <Paper
          fixed
          class="preview-paper"
        >
          <div
            v-if="unit === null"
            class="preview-empty"
          >
            {{ loading ? '' : t('preview.empty') }}
          </div>
          <div
            v-else
            :key="unit.id"
            class="preview-body"
          >
            <div
              class="preview-grab"
              @pointerdown="onDown"
              @pointermove="onMove"
              @pointerup="onUp"
              @pointercancel="onUp"
            >
              <span class="grabber" />
            </div>
            <PreviewHeader
              :unit="unit"
              :note-mode="noteMode ?? 'add'"
              :later-at="laterAt"
              @note="emit('noteAdd')"
              @note-connect="emit('deviceSettings')"
              @note-refresh="emit('notesReload')"
              @later="emit('later', $event)"
              @clear-later="emit('clearLater')"
            />
            <div class="preview-scroll">
              <div
                v-if="timeline.pending.value && !timeline.payload.value"
                class="tl-skeleton"
                aria-hidden="true"
              >
                <span /><span /><span />
              </div>
              <p
                v-if="timeline.error.value"
                class="inbox-status error"
              >
                {{ t('preview.failed') }}
                <AppButton
                  variant="link"
                  @click="timeline.load(unit.id, true)"
                  >{{ t('preview.retry') }}</AppButton
                >
              </p>
              <Timeline
                v-if="timeline.payload.value"
                :key="timeline.payload.value.id"
                :entries="timeline.payload.value.entries"
                :items="timeline.payload.value.items ?? []"
                :unit="unit"
                :viewer="viewer"
                :truncated="timeline.payload.value.truncated"
                :original-url="unit.url"
                :notes="notes ?? unit.notes ?? []"
                :notes-editable="notesEditable"
                :editable-note-ids="editableNoteIds"
                @note-save="emit('noteSave', $event)"
                @note-move="emit('noteMove', $event)"
                @note-delete="emit('noteDelete', $event)"
                @note-cancel="emit('noteCancel', $event)"
              />
            </div>
          </div>
        </Paper>
      </aside>
    </Transition>
  </div>
</template>

<style scoped>
.inbox-status {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  color: var(--muted);
  font-size: 12.5px;
}

.inbox-status.error {
  color: var(--fg);
}

.inbox-status.error::before,
.status-dot {
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.inbox-status.error::before {
  content: '';
}

.status-dot {
  background: var(--muted);
}

.status-dot.pulse {
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.25;
  }
}

.preview-root {
  display: none;
  min-width: 0;
}

.preview {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

/* The panel pins to the viewport edge, so the grain pins with it (fixed). */
.preview-paper {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

/* Paper's body is `flex: 1 0 auto; min-height: 100%`, so it grows with its
   content and nothing below it ever scrolls. Let it shrink to the panel so the
   timeline scroller inside gets a bounded height. */
.preview-paper :deep(.ui-paper-body) {
  flex: 1 1 0;
  min-height: 0;
}

.preview-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  animation: fade-in var(--dur-2) var(--ease) both;
}

.preview-empty {
  display: grid;
  flex: 1;
  place-items: center;
  padding: 64px 40px;
  color: var(--muted);
  font-size: 13.5px;
  text-align: center;
}

.preview-grab {
  display: none;
  justify-content: center;
  padding: 10px 0 2px;
  touch-action: none;
}

.preview-scroll {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 24px 28px;
  overflow: auto;
  overscroll-behavior: contain;
}

.tl-skeleton span {
  display: block;
  height: 10px;
  margin: 0 0 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--soft-2), var(--soft), var(--soft-2)) 0 0 / 200% 100%;
  animation: shimmer 1.6s linear infinite;
}

.tl-skeleton span:nth-child(1) {
  width: 70%;
}

.tl-skeleton span:nth-child(2) {
  width: 45%;
}

.tl-skeleton span:nth-child(3) {
  width: 60%;
}

.grabber {
  display: block;
  width: 36px;
  height: 4px;
  border-radius: 99px;
  background: var(--faint);
}

.preview-mask {
  position: absolute;
  inset: 0;
  z-index: 0;
  border: 0;
  background: color-mix(in oklab, var(--fg) 28%, transparent);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (min-width: 1100px) {
  .inbox-shell {
    grid-template-columns: 216px minmax(0, 1fr) 460px;
  }

  /* Docked under the site header, so it sticks below it instead of behind it. */
  .preview-root {
    display: block;
    position: sticky;
    top: var(--header-h);
    height: calc(100vh - var(--header-h));
  }

  .preview {
    border-left: 1px solid var(--line);
  }

  .preview-mask {
    display: none;
  }
}

@media (max-width: 1099px) {
  .preview-root.open {
    position: fixed;
    z-index: 36;
    display: block;
    inset: 0;
  }

  .preview-root.open .preview {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    width: min(460px, 100%);
    height: 100%;
    border-left: 1px solid var(--line);
  }

  .preview.slide-enter-active,
  .preview.slide-leave-active {
    transition:
      transform var(--dur-2) var(--ease),
      opacity var(--dur-2) var(--ease);
  }

  .preview.slide-enter-from,
  .preview.slide-leave-to {
    opacity: 0;
    transform: translateX(24px);
  }
}

@media (max-width: 760px) {
  .preview-grab {
    display: flex;
  }

  .preview-head {
    padding: 12px 18px 18px;
  }

  .preview-scroll {
    padding: 20px 18px calc(28px + env(safe-area-inset-bottom));
  }

  .preview-root.sheet.open .preview {
    top: max(64px, 12vh);
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: auto;
    border-top: 1px solid var(--line);
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    border-left: 0;
  }

  .preview {
    transform: translateY(var(--drag, 0px));
  }

  .preview.sheet-enter-active,
  .preview.sheet-leave-active {
    transition: transform var(--dur-3) var(--ease);
  }

  .preview.sheet-enter-from,
  .preview.sheet-leave-to {
    transform: translateY(100%);
  }
}
</style>

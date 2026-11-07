<script setup lang="ts">
import type { MenuItem } from '@froq/ui/vue'
import type { UnitView } from '#shared/unit'
import { IconButton, Menu } from '@froq/ui'
const { t } = useI18n()
import { laterAt as laterPresetAt } from '~/composables/useLater'
import { relativeAge, untilTime } from '~/utils/time'

const props = defineProps<{
  unit: UnitView
  /** Pencil while notes can be added. Otherwise a status in that same slot. */
  noteMode?: 'add' | 'loading' | 'connect' | 'refresh' | 'retry'
  /** Timestamp this unit is snoozed until; absent means it is not marked later. */
  laterAt?: number
}>()

const emit = defineEmits<{
  note: []
  noteConnect: []
  noteRefresh: []
  later: [at: number]
  clearLater: []
}>()

const noteLabel = computed(() => {
  if (props.noteMode === 'loading') return t('note.loadingLocal')
  if (props.noteMode === 'connect') return t('note.requiresLocal')
  if (props.noteMode === 'refresh') return t('note.storageOffline')
  if (props.noteMode === 'retry') return t('note.reloadLocal')
  return t('note.add')
})

function onNoteAction(): void {
  if (props.noteMode === 'connect') emit('noteConnect')
  else if (props.noteMode === 'refresh' || props.noteMode === 'retry') emit('noteRefresh')
  else if (props.noteMode !== 'loading') emit('note')
}

function openGithub(): void {
  window.open(props.unit.url, '_blank', 'noreferrer')
}

const opened = computed(() => relativeAge(t, Date.now() - Date.parse(props.unit.createdAt)))
const active = computed(() =>
  props.unit.lastOwnActivityAt
    ? relativeAge(t, Date.now() - Date.parse(props.unit.lastOwnActivityAt))
    : null,
)

const laterOpen = ref(false)
const laterWhen = computed(() => (props.laterAt ? untilTime(props.laterAt) : ''))
const laterItems = computed<MenuItem[]>(() => [
  { value: 'hour', label: t('menu.laterHour') },
  { value: 'tonight', label: t('menu.laterTonight') },
  { value: 'tomorrow', label: t('menu.laterTomorrow') },
  { value: 'week', label: t('menu.laterWeek') },
  ...(props.laterAt
    ? [{ value: 'clear', label: t('menu.laterClear'), separatorBefore: true }]
    : []),
])

/**
 * The library's Menu does not turn the layer's dismiss event into a close, so
 * Escape has to close it here. The listener only runs while the sheet is open.
 */
function onEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !laterOpen.value) return
  laterOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onEscape, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape, true))

function pickLater(item: MenuItem): void {
  laterOpen.value = false
  if (item.value === 'clear') {
    emit('clearLater')
    return
  }
  emit('later', laterPresetAt(item.value as 'hour' | 'tonight' | 'tomorrow' | 'week'))
}
</script>

<template>
  <header class="preview-head">
    <p class="preview-kicker">
      <KindIcon :kind="unit.kind === 'issue-only' ? 'issue' : 'pr'" />
      <span>{{ unit.repo }}</span>
      <span>#{{ unit.number }}</span>
    </p>
    <h2>{{ unit.title }}</h2>
    <div class="preview-meta">
      <p class="meta-line">{{ t('openedFor', { age: opened }) }}</p>
      <p
        v-if="active"
        class="meta-line"
      >
        {{ t('activeFor', { age: active }) }}
      </p>
    </div>
    <UnitTags
      class="preview-tags"
      :unit="unit"
    />
    <div class="preview-actions">
      <div class="action-group">
        <IconButton
          class="action"
          :label="noteLabel"
          :title="noteLabel"
          :frame="false"
          :aria-busy="noteMode === 'loading'"
          :action="onNoteAction"
        >
          <template #icon>
            <svg
              v-if="noteMode === 'loading'"
              class="spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            >
              <circle
                cx="12"
                cy="12"
                r="7"
                stroke-dasharray="28 16"
              />
            </svg>
            <svg
              v-else-if="noteMode === 'connect'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 7v3" />
              <path d="M15 7v3" />
              <path d="M7 10h10v3a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-3Z" />
              <path d="M12 17v4" />
            </svg>
            <svg
              v-else-if="noteMode === 'refresh' || noteMode === 'retry'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 12a8 8 0 1 1-2.2-5.5" />
              <path d="M20 4v5h-5" />
            </svg>
            <svg
              v-else
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
        <Menu
          v-model="laterOpen"
          class="osdash-menu"
          :label="t('preview.markLater')"
          :modal="false"
          :items="laterItems"
          side="bottom"
          align="start"
          :side-offset="4"
          @select="pickLater"
        >
          <template #trigger>
            <AppButton
              variant="icon"
              class="action"
              :class="{ 'has-time': laterAt }"
              :aria-label="t('preview.markLater')"
              :title="t('preview.markLater')"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="13"
                  r="8"
                />
                <path d="M12 9v4l2.5 2.5" />
                <path d="M9 2h6" />
              </svg>
              <span
                v-if="laterAt"
                class="action-time"
                >{{ laterWhen }}</span
              >
            </AppButton>
          </template>
          <template #item="{ item }">
            <span>{{ item.label }}</span>
          </template>
        </Menu>
      </div>
      <IconButton
        class="action github-link"
        :label="t('preview.openGithub')"
        :title="t('preview.openGithub')"
        :frame="false"
        :action="openGithub"
      >
        <template #icon>
          <svg
            class="github-mark"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path
              d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.88 2.34.67.07-.52.28-.88.51-1.08-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
        </template>
      </IconButton>
    </div>
  </header>
</template>

<style scoped>
.preview-head {
  flex: 0 0 auto;
  padding: 28px 28px 20px;
  border-bottom: 1px solid var(--line);
}

.preview-kicker {
  display: flex;
  gap: 6px;
  align-items: center;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11.5px;
}

.preview-head h2 {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.15;
  text-wrap: balance;
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 10px;
}

.preview-tags {
  margin-top: 12px;
}

.meta-line {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11.5px;
  line-height: 1.5;
}

/* The left cluster holds the card's own actions; the repo link sits alone on
   the right so the row reads as two ends. */
.preview-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.action-group {
  display: flex;
  gap: 2px;
  align-items: center;
  margin-left: -6px;
}

.action.ui-icon-button,
button.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 2px;
  background: none;
  color: var(--muted);
  cursor: pointer;
  transition:
    color var(--dur-1) var(--ease),
    background-color var(--dur-1) var(--ease);
}

.action:hover:not(:disabled),
.action:focus-visible {
  background: var(--soft);
  color: var(--fg);
}

.action:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 1px;
}

.action :deep(svg) {
  width: 16px;
  height: 16px;
}

.action :deep(svg.spin) {
  transform-origin: center;
  animation: note-spin 0.8s linear infinite;
}

@keyframes note-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .action :deep(svg.spin) {
    animation: none;
  }
}

/* Snoozed state: the clock grows a meta timestamp and stops being square.
   Left pad keeps the icon at the same 7px inset it sits at in the 30px box,
   so adding the time never nudges the glyph. */
.action.has-time {
  justify-content: flex-start;
  width: auto;
  gap: 5px;
  padding: 0 8px 0 6px;
}

.action-time {
  font-family: var(--font-meta);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

/* A filled mark reads heavier than the same box drawn in strokes. */
.github-mark {
  width: 15px;
  height: 15px;
}

@media (max-width: 760px) {
  .preview-head h2 {
    font-size: 22px;
  }

  .preview-actions .action {
    min-height: 36px;
  }
}

@media (max-width: 760px) {
  .preview-head {
    padding: 12px 18px 18px;
  }
}
</style>

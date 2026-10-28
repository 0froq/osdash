<script setup lang="ts">
import type { UnitView } from '#shared/unit'
import { IconControl } from '@froq/ui'
import { copy } from '~/copy/en'
import { stateLabel } from '~/utils/category'
import { reasonText } from '~/utils/reason'
import { relativeAge } from '~/utils/time'

const props = defineProps<{
  unit: UnitView
  notesEditable?: boolean
  noteDisabledReason?: string
}>()

const emit = defineEmits<{
  note: []
}>()

const reason = computed(() =>
  props.unit.reasonCode === 'clef' && props.unit.quote
    ? props.unit.quote
    : reasonText(props.unit.reasonCode, props.unit.reasonActor),
)
const opened = computed(() => relativeAge(Date.now() - Date.parse(props.unit.createdAt)))
</script>

<template>
  <header class="preview-head">
    <p class="preview-kicker">
      <KindIcon :kind="unit.kind === 'issue-only' ? 'issue' : 'pr'" />
      <span>{{ unit.repo }}</span>
      <span>#{{ unit.number }}</span>
      ·
      {{ copy.openedFor(opened) }}
    </p>
    <h2>{{ unit.title }}</h2>
    <p class="preview-status">
      <span class="preview-state">{{ stateLabel(unit.state) }}</span>
      <span
        class="preview-reason"
        :class="{ mine: unit.myTurn }"
        >{{ reason }}</span
      >
      <IconControl
        class="status-link"
        :label="copy.preview.openGithub"
        :href="unit.url"
        :bordered="false"
      >
        <svg
          class="github-mark"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path
            d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.88 2.34.67.07-.52.28-.88.51-1.08-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
          />
        </svg>
      </IconControl>
    </p>
    <div class="preview-actions">
      <div class="action-group">
        <IconControl
          class="action"
          :label="notesEditable ? copy.note.add : (noteDisabledReason ?? copy.note.requiresLocal)"
          :title="notesEditable ? copy.note.add : (noteDisabledReason ?? copy.note.requiresLocal)"
          :disabled="!notesEditable"
          :bordered="false"
          @click="notesEditable && emit('note')"
        >
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
        </IconControl>
      </div>
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

.preview-status {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  align-items: baseline;
  margin-top: 10px;
}

/* The repo link sits at the far end of the status line, not in the action row. */
.status-link.ui-button,
a.status-link {
  display: inline-grid;
  flex: none;
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  place-items: center;
  margin-left: auto;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: none;
  color: var(--muted);
  cursor: pointer;
  text-decoration: none;
  transition: color var(--dur-1) var(--ease);
}

.status-link:hover {
  color: var(--fg);
}

.status-link:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 1px;
}

.status-link svg {
  width: 14px;
  height: 14px;
}

.preview-reason {
  font-size: 14.5px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.preview-reason.mine {
  color: var(--accent);
}

.preview-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

/* The three glyphs are one group of equal actions: same box, same idle state,
   same hover. No member is the primary one, so none is tinted at rest. */
.action-group {
  display: flex;
  gap: 2px;
  align-items: center;
  margin-left: -6px;
}

.preview-actions .action.ui-button,
.preview-actions a.action,
.preview-actions .action {
  display: inline-grid;
  box-sizing: border-box;
  width: 30px;
  height: 30px;
  place-items: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 2px;
  background: none;
  color: var(--muted);
  cursor: pointer;
  text-decoration: none;
  transition:
    color var(--dur-1) var(--ease),
    background-color var(--dur-1) var(--ease);
}

.preview-actions .action:hover:not(:disabled),
.preview-actions .action:focus-visible {
  background: var(--soft);
  color: var(--fg);
}

.preview-actions .action[aria-pressed='true'] {
  color: var(--accent);
}

.preview-actions .action:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 1px;
}

.preview-actions .action svg {
  width: 16px;
  height: 16px;
}

/* A filled mark reads heavier than the same box drawn in strokes. */
.github-mark {
  width: 15px;
  height: 15px;
}

@media (max-width: 760px) {
  .preview-kicker {
    display: flex;
    gap: 6px;
    align-items: center;
    color: var(--muted);
    font-family: var(--font-meta);
    font-size: 11.5px;
  }

  .preview-head h2 {
    font-size: 22px;
  }

  .preview-actions button,
  .preview-actions a {
    min-height: 36px;
  }
}

@media (max-width: 760px) {
  .preview-head {
    padding: 12px 18px 18px;
  }
}
</style>

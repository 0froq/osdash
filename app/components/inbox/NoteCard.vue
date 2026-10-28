<script setup lang="ts">
import type { UnitNote } from '#shared/unit'
import { copy } from '~/copy/en'

const props = defineProps<{
  note: UnitNote
  editable?: boolean
  /** Rows the note can be moved to. */
  anchors: Array<{ id: string; label: string }>
}>()

const emit = defineEmits<{
  save: [payload: { text: string; version: string | null }]
  move: [anchor: string]
  remove: []
  cancel: []
}>()

// A freshly created note arrives empty, so it opens straight into the field.
const editing = ref(Boolean(props.editable) && props.note.text.length === 0)
const draft = ref(props.note.text)
const draftVersion = ref(props.note.version ?? null)

/**
 * The note's own stamp may sit between two rows, so it is offered as its own
 * option. Without it the select would show a row the note is not on.
 */
const options = computed(() => {
  if (props.anchors.some(anchor => anchor.id === props.note.anchor)) return props.anchors
  // Between two rows: keep the note's own stamp as a selectable position.
  return [{ id: props.note.anchor, label: copy.note.current }, ...props.anchors]
})
const field = ref<HTMLTextAreaElement>()

function start(): void {
  if (!props.editable) return
  draft.value = props.note.text
  draftVersion.value = props.note.version ?? null
  editing.value = true
  void nextTick(() => field.value?.focus())
}

function commit(): void {
  if (!props.editable) return
  const text = draft.value.trim()
  if (!text) return
  emit('save', { text, version: draftVersion.value })
  editing.value = false
}

function cancel(): void {
  draft.value = props.note.text
  editing.value = false
  // An empty note was never saved, so the caller drops it.
  if (props.note.text.length === 0) emit('cancel')
}

onMounted(() => {
  if (editing.value) void nextTick(() => field.value?.focus())
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
  <div class="note">
    <p class="note-head">
      <span class="note-label">{{ copy.note.label }}</span>
      <span
        v-if="note.unsaved"
        class="note-label"
        >{{ copy.note.unsaved }}</span
      >
      <button
        v-if="editable && !editing"
        type="button"
        class="note-action"
        :aria-label="copy.note.edit"
        @click="start"
      >
        {{ copy.note.edit }}
      </button>
    </p>
    <template v-if="editing">
      <textarea
        ref="field"
        v-model="draft"
        class="note-field"
        rows="2"
        :placeholder="copy.note.placeholder"
        :disabled="!editable"
        @keydown="onKey"
      />
      <p class="note-actions">
        <button
          type="button"
          :disabled="!editable"
          @click="commit"
        >
          {{ copy.note.save }}
        </button>
        <button
          type="button"
          @click="cancel"
        >
          {{ copy.note.cancel }}
        </button>
      </p>
    </template>
    <MarkdownBody
      v-else
      class="note-text"
      :source="note.text"
    />
    <p class="note-meta">
      <label class="note-where">
        <span class="note-where-label">{{ copy.note.at }}</span>
        <select
          class="note-move"
          :aria-label="copy.note.move"
          :value="note.anchor"
          :disabled="!editable || editing"
          @change="editable && !editing && emit('move', ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="anchor in options"
            :key="anchor.id"
            :value="anchor.id"
          >
            {{ anchor.label }}
          </option>
        </select>
      </label>
      <button
        v-if="editable && !editing"
        type="button"
        class="note-remove"
        @click="emit('remove')"
      >
        {{ copy.note.remove }}
      </button>
    </p>
  </div>
</template>

<style scoped>
.note {
  margin: 6px 0 10px;
  padding: 10px 12px;
  border-left: 2px solid var(--accent);
  border-radius: 0 6px 6px 0;
  background: color-mix(in oklab, var(--accent) 5%, transparent);
}

.note-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.note-label {
  color: var(--accent);
  font-family: var(--font-meta);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.note-action {
  padding: 0;
  border: 0;
  background: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 12.5px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.note-action:hover {
  color: var(--fg);
}

.note-field {
  width: 100%;
  margin-top: 6px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--card);
  color: var(--fg);
  font: inherit;
  font-size: 13.5px;
  line-height: 1.5;
  resize: vertical;
}

.note-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.note-actions button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--fg);
  cursor: pointer;
  font-size: 12.5px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.note-text {
  margin-top: 4px;
  font-size: 13.5px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.note-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 8px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11px;
}

.note-where {
  display: inline-flex;
  gap: 5px;
  align-items: baseline;
}

.note-where-label {
  color: var(--muted);
}

.note-move {
  max-width: 15em;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: none;
  color: var(--fg);
  font: inherit;
  cursor: pointer;
  text-overflow: ellipsis;
}

.note-remove {
  padding: 0;
  border: 0;
  background: none;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.note-remove:hover {
  color: var(--accent);
}
</style>

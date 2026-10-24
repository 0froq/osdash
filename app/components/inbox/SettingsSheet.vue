<script setup lang="ts">
import { withMockQuery } from '#shared/mock-mode'
import { copy } from '~/copy/en'

const open = defineModel<boolean>('open', { required: true })
const { mock } = useMockMode()

type SettingsResponse = {
  configured: boolean
  baseUrl: string
  model: string
  clefBuiltIn: boolean
}

const baseUrl = ref('')
const model = ref('')
const apiKey = ref('')
const clefBuiltIn = ref(false)
const saving = ref(false)
const message = ref('')

const dialog = ref<HTMLDialogElement>()

watch(open, shown => {
  const el = dialog.value
  if (!el) return
  if (shown && !el.open) {
    el.showModal()
    void load()
  } else if (!shown && el.open) {
    el.close()
  }
})

async function load(): Promise<void> {
  message.value = ''
  apiKey.value = ''
  try {
    const body = await $fetch<SettingsResponse>(withMockQuery('/api/settings', mock.value))
    baseUrl.value = body.baseUrl
    model.value = body.model
    clefBuiltIn.value = body.clefBuiltIn
  } catch {
    message.value = copy.settings.loadFailed
  }
}

async function save(clear = false): Promise<void> {
  saving.value = true
  message.value = ''
  try {
    await $fetch(withMockQuery('/api/settings', mock.value), {
      method: 'PUT',
      body: clear
        ? { clear: true }
        : { baseUrl: baseUrl.value, model: model.value, apiKey: apiKey.value },
    })
    message.value = clear ? copy.settings.cleared : copy.settings.saved
    apiKey.value = ''
    if (clear) {
      baseUrl.value = ''
      model.value = ''
    }
  } catch {
    message.value = copy.settings.saveFailed
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="settings-dialog"
    @close="open = false"
    @keydown.esc.stop
    @click.self="open = false"
  >
    <form
      class="settings-panel"
      @submit.prevent
    >
      <h2>{{ copy.settings.title }}</h2>
      <p class="settings-note">{{ copy.settings.intro }}</p>
      <p
        v-if="clefBuiltIn"
        class="settings-note"
        >{{ copy.settings.enabled }}</p
      >
      <label>
        <span>{{ copy.settings.baseUrl }}</span>
        <input
          v-model="baseUrl"
          type="url"
        />
      </label>
      <label>
        <span>{{ copy.settings.model }}</span>
        <input
          v-model="model"
          type="text"
        />
      </label>
      <label>
        <span>{{ copy.settings.apiKey }}</span>
        <input
          v-model="apiKey"
          type="password"
          autocomplete="off"
        />
      </label>
      <p
        v-if="message"
        class="settings-note"
        >{{ message }}</p
      >
      <p class="settings-actions">
        <button
          type="button"
          :disabled="saving"
          @click="save(false)"
          >{{ copy.settings.save }}</button
        >
        <button
          type="button"
          :disabled="saving"
          @click="save(true)"
          >{{ copy.settings.clear }}</button
        >
        <button
          type="button"
          @click="open = false"
          >{{ copy.settings.close }}</button
        >
      </p>
    </form>
  </dialog>
</template>

<style scoped>
.settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}

.settings-actions button {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  font-size: 13px;
  transition: background-color var(--dur-1) var(--ease);
}

.settings-actions button:hover:not(:disabled) {
  background: var(--soft);
}

.settings-actions button:disabled {
  cursor: default;
  opacity: 0.5;
}

.settings-dialog {
  width: min(440px, calc(100% - 32px));
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: var(--card);
  box-shadow: var(--shadow-pop);
  color: var(--fg);
}

.settings-dialog[open] {
  animation: dialog-in var(--dur-2) var(--ease) both;
}

.settings-dialog::backdrop {
  background: color-mix(in oklab, var(--fg) 28%, transparent);
  animation: fade-in var(--dur-2) var(--ease) both;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
}

.settings-panel h2 {
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1.15;
}

.settings-note {
  color: var(--muted);
  font-size: 13.5px;
}

.settings-panel label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.settings-panel input {
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--fg);
  font: inherit;
  transition: border-color var(--dur-1) var(--ease);
}

.settings-panel input:hover {
  border-color: color-mix(in oklab, var(--fg) 24%, transparent);
}

@media (max-width: 760px) {
  .settings-actions button {
    min-height: 36px;
  }
}
</style>

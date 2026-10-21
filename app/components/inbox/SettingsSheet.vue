<script setup lang="ts">
import { copy } from '~/copy/zh-CN'

const open = defineModel<boolean>('open', { required: true })

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

watch(open, shown => {
  if (shown) void load()
})

async function load(): Promise<void> {
  message.value = ''
  apiKey.value = ''
  const params = import.meta.dev ? '?mock=1' : ''
  try {
    const body = await $fetch<SettingsResponse>(`/api/settings${params}`)
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
  const params = import.meta.dev ? '?mock=1' : ''
  try {
    await $fetch(`/api/settings${params}`, {
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
    v-if="open"
    class="settings-dialog"
    open
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
      <p class="preview-actions">
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

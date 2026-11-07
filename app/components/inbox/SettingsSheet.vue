<script setup lang="ts">
import { Button } from '@froq/ui'
const { t } = useI18n()

defineProps<{ viewerLogin: string }>()
const open = defineModel<boolean>('open', { required: true })

const dialog = ref<HTMLDialogElement>()

watch(open, shown => {
  const el = dialog.value
  if (typeof document !== 'undefined')
    document.documentElement.style.overflow = shown ? 'hidden' : ''
  if (!el) return
  if (shown && !el.open) el.showModal()
  else if (!shown && el.open) el.close()
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.documentElement.style.overflow = ''
})
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
      <h2>{{ t('settings.title') }}</h2>
      <LocalConnectionSettings
        v-if="open"
        :viewer-login="viewerLogin"
      />
      <p class="settings-actions">
        <Button
          type="button"
          @click="open = false"
          >{{ t('settings.close') }}</Button
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

.settings-dialog {
  width: min(460px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  overscroll-behavior: none;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--ui-radius);
  background: var(--card);
  color: var(--fg);
}

.settings-dialog[open] {
  animation: dialog-in var(--dur-2) var(--ease) both;
}

.settings-dialog::backdrop {
  background: color-mix(in oklab, var(--bg) 28%, transparent);
  opacity: 0;
  backdrop-filter: blur(16px);
  transition:
    opacity var(--dur-2) var(--ease),
    overlay var(--dur-2) var(--ease) allow-discrete,
    display var(--dur-2) var(--ease) allow-discrete;
}

.settings-dialog[open]::backdrop {
  opacity: 1;
}

@starting-style {
  .settings-dialog[open]::backdrop {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .settings-dialog::backdrop {
    transition: none;
  }
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 24px 20px;
}

.settings-panel h2 {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
</style>

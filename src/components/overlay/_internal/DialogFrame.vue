<script setup lang="ts">
import { DialogClose, DialogDescription, DialogTitle } from 'reka-ui'

defineProps<{
  title?: string
  description?: string
  closeLabel: string
  renderClose?: boolean
}>()
</script>

<template>
  <div class="ui-dialog-content">
    <header class="ui-dialog-header">
      <DialogTitle class="ui-dialog-title">{{ title }}</DialogTitle>
      <DialogDescription
        v-if="description"
        class="ui-dialog-description"
      >
        {{ description }}
      </DialogDescription>
    </header>
    <DialogClose
      v-if="renderClose"
      class="ui-overlay-close"
      :aria-label="closeLabel"
    >
      <span aria-hidden="true">×</span>
    </DialogClose>
    <div class="ui-dialog-body"><slot /></div>
    <footer
      v-if="$slots.footer"
      class="ui-dialog-footer"
      ><slot name="footer"
    /></footer>
  </div>
</template>

<style scoped>
.ui-dialog-content {
  box-sizing: border-box;
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 1001;
  width: min(32rem, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 24px;
  border: 1px solid var(--ui-line);
  border-radius: var(--ui-radius);
  background: var(--ui-bg);
  color: var(--ui-fg);
  font-family: var(--ui-font-text);
  line-height: 1.5;
  box-shadow: none;
  transform: translate(-50%, -50%);
}

.ui-dialog-title {
  margin: 0;
  padding-inline-end: 32px;
  font-family: var(--ui-font-display);
  font-size: 28px;
  font-weight: normal;
  line-height: 1.2;
}

.ui-dialog-description {
  margin: 8px 0 0;
  color: var(--ui-muted);
  font-size: 14px;
}

.ui-dialog-body {
  margin-block: 24px;
}

.ui-dialog-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: 16px;
  padding-block-start: 16px;
  border-top: 1px solid var(--ui-line);
}

.ui-overlay-close {
  position: absolute;
  top: 14px;
  inset-inline-end: 14px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  padding: 0;
  border: 0;
  background: none;
  color: var(--ui-muted);
  font: inherit;
  cursor: pointer;
}

.ui-overlay-close:hover {
  color: var(--ui-fg);
}

.ui-overlay-close:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 4px;
}

.ui-dialog-content:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: -1px;
}
</style>

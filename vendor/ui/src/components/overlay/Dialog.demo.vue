<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import Button from '../button/Button.vue'
import TextInput from '../field/TextInput.vue'
import Dialog from './Dialog.vue'

const open = ref(false)
const name = ref('Untitled')
const detailsOpen = ref(false)
const selected = ref('')
const opener = shallowRef<HTMLElement>()
function inspect(event: MouseEvent, document: string) {
  opener.value = event.currentTarget as HTMLElement
  selected.value = document
  detailsOpen.value = true
}
</script>

<template>
  <Dialog
    v-model="open"
    title="Rename document"
    description="The new name stays in this demo."
    trigger-label="Open dialog"
    close-label="Close dialog"
  >
    <TextInput
      v-model="name"
      label="Document name"
    />
    <template #footer="{ close }">
      <Button @click="close">
        Done
      </Button>
    </template>
  </Dialog>
  <div>
    <p>Several entries can open one controlled dialog.</p>
    <Button
      v-for="document in ['Draft', 'Notes']"
      :key="document"
      aria-haspopup="dialog"
      @click="inspect($event, document)"
    >
      Inspect {{ document }}
    </Button>
    <Dialog
      v-model="detailsOpen"
      :show-trigger="false"
      :return-focus="opener"
      :title="selected || 'Document details'"
      close-label="Close details"
    >
      <p>Selected document: {{ selected }}.</p>
    </Dialog>
  </div>
</template>

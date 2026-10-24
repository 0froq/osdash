<script setup lang="ts">
import type { ChoiceOption } from '@froq/ui'
import { Button, CopyButton, Dialog, Drawer, Navigation, Tabs } from '@froq/ui'
import { useChoice, useClipboard } from '@froq/ui/vue'
import { computed, ref, shallowRef } from 'vue'
import '@froq/ui/style.css'

// Landing pages own labels, code blocks, section collection and scroll spy.
const section = ref('overview')
const sections = [
  { value: 'overview', label: 'Overview', href: '#overview' },
  { value: 'details', label: 'Details', href: '#details' },
]

// Palette-specific conversion and skin stay outside the shared radio/clipboard behavior.
type Variant = 'light-soft' | 'dark-crisp'
const variant = ref<Variant>('light-soft')
const variants: ChoiceOption<Variant>[] = [
  { value: 'light-soft', label: 'Light / soft' },
  { value: 'dark-crisp', label: 'Dark / crisp' },
]
const choice = useChoice(variants, variant)
const paletteValue = computed(() => variant.value === 'light-soft' ? '#f3f1ed' : '#161616')
const clipboard = useClipboard(paletteValue)
const copyLabel = computed(() => ({
  idle: 'Copy palette value',
  pending: 'Copying palette value',
  copied: 'Palette value copied',
  error: 'Copy failed',
})[clipboard.status.value])
function choose(next: Variant) {
  if (!choice.isDisabled(next))
    variant.value = next
}

// A person/entry is selected by multiple external buttons, not by the modal itself.
const people = ['Ada', 'Lin']
const selected = ref('')
const open = ref(false)
const drawerOpen = ref(false)
const opener = shallowRef<HTMLElement>()
const drawerOpener = shallowRef<HTMLElement>()
const noteTab = ref<'mine' | 'theirs'>('mine')
function inspect(event: MouseEvent, person: string) {
  opener.value = event.currentTarget as HTMLElement
  selected.value = person
  noteTab.value = 'mine'
  open.value = true
}
function showContents(event: MouseEvent) {
  drawerOpener.value = event.currentTarget as HTMLElement
  drawerOpen.value = true
}
</script>

<template>
  <div class="ui">
    <Navigation
      v-model="section"
      :items="sections"
      current="location"
      aria-label="Page sections"
    />
    <section id="overview">
      <h2>Shared actions, consumer content</h2>
      <code>pnpm add ./vendor/ui</code>
      <CopyButton
        text="pnpm add ./vendor/ui"
        label="Copy command"
        copied-label="Copied"
        error-label="Copy failed"
      />
      <div
        role="radiogroup"
        aria-label="Palette variant"
      >
        <Button
          v-for="option in variants"
          :key="option.value"
          role="radio"
          :aria-checked="choice.isActive(option.value)"
          :disabled="choice.isDisabled(option.value)"
          :tabindex="choice.tabindex(option.value)"
          @click="choose(option.value)"
          @keydown="choice.onKeydown($event, choose, option.value)"
        >
          {{ option.label }}
        </Button>
      </div>
      <Button
        :aria-label="copyLabel"
        :aria-busy="clipboard.status.value === 'pending'"
        :disabled="clipboard.status.value === 'pending'"
        @click="clipboard.copy()"
      >
        {{ paletteValue }}
      </Button>
      <p
        role="status"
        aria-live="polite"
      >
        {{ clipboard.status.value === 'copied' || clipboard.status.value === 'error' ? copyLabel : '' }}
      </p>
    </section>
    <section id="details">
      <h2>External modal openers</h2>
      <Button
        v-for="person in people"
        :key="person"
        aria-haspopup="dialog"
        @click="inspect($event, person)"
      >
        Inspect {{ person }}
      </Button>
      <Dialog
        v-model="open"
        :title="selected || 'Person details'"
        :show-trigger="false"
        :return-focus="opener"
        close-label="Close person details"
      >
        <Tabs
          v-model="noteTab"
          label="Notes"
          :items="[{ value: 'mine', label: 'My notes' }, { value: 'theirs', label: 'Their notes', disabled: selected === 'Lin' }]"
        >
          <template #default="{ item }">
            <p>{{ item.value === 'mine' ? 'Consumer-owned impression' : 'Consumer-owned reply' }}</p>
          </template>
        </Tabs>
      </Dialog>
      <Button
        aria-haspopup="dialog"
        :aria-expanded="drawerOpen"
        @click="showContents"
      >
        Open page contents
      </Button>
      <Drawer
        v-model="drawerOpen"
        :show-trigger="false"
        :return-focus="drawerOpener"
        title="Page contents"
        close-label="Close contents"
        side="left"
      >
        <Navigation
          v-model="section"
          :items="sections"
          current="location"
          aria-label="Page sections"
          @update:model-value="drawerOpen = false"
        />
      </Drawer>
    </section>
  </div>
</template>

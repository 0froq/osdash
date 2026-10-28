<script setup lang="ts">
import type { MenuItem } from '@froq/ui/vue'
import type { UnitView } from '#shared/unit'
import { Menu } from '@froq/ui'
import { copy } from '~/copy/en'
import { laterAt } from '~/composables/useLater'

defineProps<{
  unit: UnitView
  x: number
  y: number
}>()

const emit = defineEmits<{
  read: []
  later: [at: number]
  close: []
}>()

const open = ref(true)

/**
 * The menu is anchored to a zero-size element pinned at the pointer, so the
 * library's own collision handling places the sheet without a second popover
 * implementation. Group labels ride along as disabled items.
 */
const items = computed<MenuItem[]>(() => [
  { value: 'read', label: copy.menu.markRead },
  { value: 'later:hour', label: copy.menu.laterHour },
  { value: 'later:tonight', label: copy.menu.laterTonight },
  { value: 'later:tomorrow', label: copy.menu.laterTomorrow },
  { value: 'later:week', label: copy.menu.laterWeek },
])

/**
 * The library's Menu does not turn the layer's dismiss event into a close, so
 * Escape has to close it here. The listener only runs while the sheet is open.
 */
function onEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !open.value) return
  open.value = false
}

onMounted(() => window.addEventListener('keydown', onEscape, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape, true))

function select(item: MenuItem): void {
  open.value = false
  if (item.value === 'read') emit('read')
  if (item.value.startsWith('later:')) {
    const preset = item.value.slice('later:'.length) as 'hour' | 'tonight' | 'tomorrow' | 'week'
    emit('later', laterAt(preset))
  }
}

watch(open, value => {
  if (!value) emit('close')
})
</script>

<template>
  <Menu
    v-model="open"
    class="osdash-menu"
    :label="copy.menu.open"
    :modal="false"
    :items="items"
    side="bottom"
    align="start"
    :side-offset="0"
    @select="select"
  >
    <template #trigger>
      <span
        class="card-menu-anchor"
        :style="{ left: `${x}px`, top: `${y}px` }"
        aria-hidden="true"
      />
    </template>
    <template #item="{ item }">
      <span :class="{ 'is-menu-label': item.disabled && item.value.startsWith('label:') }">
        {{ item.label }}
      </span>
    </template>
  </Menu>
</template>

<style scoped>
.card-menu-anchor {
  position: fixed;
  width: 0;
  height: 0;
  pointer-events: none;
}
</style>

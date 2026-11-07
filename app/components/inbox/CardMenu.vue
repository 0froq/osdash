<script setup lang="ts">
import type { MenuItem } from '@froq/ui/vue'
import type { UnitView } from '#shared/unit'
import { Menu } from '@froq/ui'
const { t } = useI18n()
import { laterAt as laterPresetAt } from '~/composables/useLater'

const props = defineProps<{
  unit: UnitView
  x: number
  y: number
  /** Timestamp this unit is snoozed until; present shows a Clear row. */
  laterAt?: number
}>()

const emit = defineEmits<{
  read: []
  later: [at: number]
  clearLater: []
  close: []
}>()

const open = ref(true)

/**
 * The menu is anchored to a zero-size element pinned at the pointer, so the
 * library's own collision handling places the sheet without a second popover
 * implementation. Group labels ride along as disabled items.
 */
const items = computed<MenuItem[]>(() => [
  { value: 'read', label: t('menu.markRead') },
  { value: 'later:hour', label: t('menu.laterHour') },
  { value: 'later:tonight', label: t('menu.laterTonight') },
  { value: 'later:tomorrow', label: t('menu.laterTomorrow') },
  { value: 'later:week', label: t('menu.laterWeek') },
  ...(props.laterAt
    ? [{ value: 'later:clear', label: t('menu.laterClear'), separatorBefore: true }]
    : []),
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
  if (item.value === 'later:clear') {
    emit('clearLater')
    return
  }
  if (item.value.startsWith('later:')) {
    const preset = item.value.slice('later:'.length) as 'hour' | 'tonight' | 'tomorrow' | 'week'
    emit('later', laterPresetAt(preset))
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
    :label="t('menu.open')"
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

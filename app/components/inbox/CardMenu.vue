<script setup lang="ts">
import type { UnitView } from '#shared/unit'
import { copy } from '~/copy/en'

const props = defineProps<{
  unit: UnitView
  x: number
  y: number
}>()

const emit = defineEmits<{
  read: []
  star: []
  later: [until: string | null]
  close: []
}>()

const menu = ref<{ el?: HTMLElement }>()
const left = ref(props.x)
const top = ref(props.y)

function place(): void {
  const node = menu.value?.el
  if (!node) return
  const rect = node.getBoundingClientRect()
  left.value = Math.max(8, Math.min(props.x, window.innerWidth - rect.width - 8))
  top.value = Math.max(8, Math.min(props.y, window.innerHeight - rect.height - 8))
}

function onPointer(event: PointerEvent): void {
  const target = event.target
  const node = menu.value?.el
  if (node && target instanceof Node && node.contains(target)) return
  emit('close')
}

onMounted(() => {
  place()
  document.addEventListener('pointerdown', onPointer)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointer)
})
</script>

<template>
  <PopMenu
    ref="menu"
    class="card-menu"
    :style="{ left: `${left}px`, top: `${top}px` }"
  >
    <button
      class="pop-item"
      type="button"
      role="menuitem"
      @click="emit('read')"
    >
      {{ copy.menu.markRead }}
    </button>
    <p class="pop-label">{{ copy.menu.later }}</p>
    <button
      class="pop-item"
      type="button"
      role="menuitem"
      @click="emit('later', 'tomorrow')"
    >
      {{ copy.laterPresets.tomorrow }}
    </button>
    <button
      class="pop-item"
      type="button"
      role="menuitem"
      @click="emit('later', 'three-days')"
    >
      {{ copy.laterPresets.threeDays }}
    </button>
    <button
      class="pop-item"
      type="button"
      role="menuitem"
      @click="emit('later', 'monday')"
    >
      {{ copy.laterPresets.nextMonday }}
    </button>
    <button
      v-if="unit.laterUntil"
      class="pop-item"
      type="button"
      role="menuitem"
      @click="emit('later', null)"
    >
      {{ copy.menu.clearLater }}
    </button>
    <button
      class="pop-item"
      type="button"
      role="menuitem"
      @click="emit('star')"
    >
      {{ unit.starred ? copy.menu.unstar : copy.menu.star }}
    </button>
  </PopMenu>
</template>

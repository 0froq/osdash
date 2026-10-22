<script setup lang="ts">
import type { UnitView } from '#shared/unit'
import { copy } from '~/copy/zh-CN'

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

const root = ref<HTMLElement>()
const left = ref(props.x)
const top = ref(props.y)

function place(): void {
  const menu = root.value
  if (!menu) return
  const rect = menu.getBoundingClientRect()
  left.value = Math.max(8, Math.min(props.x, window.innerWidth - rect.width - 8))
  top.value = Math.max(8, Math.min(props.y, window.innerHeight - rect.height - 8))
}

function onPointer(event: PointerEvent): void {
  const target = event.target
  if (target instanceof Node && root.value?.contains(target)) return
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
  <div
    ref="root"
    class="card-menu"
    role="menu"
    :style="{ left: `${left}px`, top: `${top}px` }"
  >
    <button
      type="button"
      role="menuitem"
      @click="emit('read')"
    >
      {{ copy.menu.markRead }}
    </button>
    <p class="card-menu-label">{{ copy.menu.later }}</p>
    <button
      type="button"
      role="menuitem"
      @click="emit('later', 'tomorrow')"
    >
      {{ copy.laterPresets.tomorrow }}
    </button>
    <button
      type="button"
      role="menuitem"
      @click="emit('later', 'three-days')"
    >
      {{ copy.laterPresets.threeDays }}
    </button>
    <button
      type="button"
      role="menuitem"
      @click="emit('later', 'monday')"
    >
      {{ copy.laterPresets.nextMonday }}
    </button>
    <button
      v-if="unit.laterUntil"
      type="button"
      role="menuitem"
      @click="emit('later', null)"
    >
      {{ copy.menu.clearLater }}
    </button>
    <button
      type="button"
      role="menuitem"
      @click="emit('star')"
    >
      {{ unit.starred ? copy.menu.unstar : copy.menu.star }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { UnitView } from '#shared/unit'
import { copy } from '~/copy/en'
import { stateLabel } from '~/utils/category'
import { reasonText } from '~/utils/reason'
import { relativeAge } from '~/utils/time'

const props = defineProps<{ unit: UnitView }>()

const emit = defineEmits<{
  star: []
  later: [preset: string | null]
}>()

const laterOpen = ref(false)
const laterRoot = ref<HTMLElement>()
const reason = computed(() =>
  props.unit.reasonCode === 'clef' && props.unit.quote
    ? props.unit.quote
    : reasonText(props.unit.reasonCode, props.unit.reasonActor),
)
const opened = computed(() => relativeAge(Date.now() - Date.parse(props.unit.createdAt)))

function pick(preset: string | null): void {
  laterOpen.value = false
  emit('later', preset)
}

function onPointer(event: PointerEvent): void {
  const target = event.target
  if (target instanceof Node && laterRoot.value?.contains(target)) return
  laterOpen.value = false
}

function onKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !laterOpen.value) return
  event.stopPropagation()
  laterOpen.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointer)
  window.addEventListener('keydown', onKey, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointer)
  window.removeEventListener('keydown', onKey, true)
})
</script>

<template>
  <header class="preview-head">
    <p class="preview-kicker">
      {{ unit.repo }}#{{ unit.number }}
      ·
      {{ copy.openedFor(opened) }}
    </p>
    <h2>{{ unit.title }}</h2>
    <p class="preview-status">
      <span class="preview-state">{{ stateLabel(unit.state) }}</span>
      <span
        class="preview-reason"
        :class="{ mine: unit.myTurn }"
        >{{ reason }}</span
      >
    </p>
    <div class="preview-actions">
      <div
        ref="laterRoot"
        class="later-wrap"
      >
        <button
          type="button"
          aria-haspopup="menu"
          :aria-expanded="laterOpen"
          @click="laterOpen = !laterOpen"
          >{{ copy.menu.later }}</button
        >
        <PopMenu
          v-if="laterOpen"
          class="later-pop"
        >
          <button
            class="pop-item"
            type="button"
            role="menuitem"
            @click="pick('tomorrow')"
            >{{ copy.laterPresets.tomorrow }}</button
          >
          <button
            class="pop-item"
            type="button"
            role="menuitem"
            @click="pick('three-days')"
            >{{ copy.laterPresets.threeDays }}</button
          >
          <button
            class="pop-item"
            type="button"
            role="menuitem"
            @click="pick('monday')"
            >{{ copy.laterPresets.nextMonday }}</button
          >
          <button
            v-if="unit.laterUntil"
            class="pop-item"
            type="button"
            role="menuitem"
            @click="pick(null)"
            >{{ copy.menu.clearLater }}</button
          >
        </PopMenu>
      </div>
      <button
        type="button"
        @click="emit('star')"
        >{{ unit.starred ? copy.menu.unstar : copy.menu.star }}</button
      >
      <a
        :href="unit.url"
        target="_blank"
        rel="noreferrer"
        >{{ copy.preview.openGithub }}</a
      >
    </div>
  </header>
</template>

<style scoped>
.preview-head {
  flex: 0 0 auto;
  padding: 28px 28px 20px;
  border-bottom: 1px solid var(--line);
}

.preview-head h2 {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.15;
  text-wrap: balance;
}

.preview-status {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  align-items: baseline;
  margin-top: 10px;
}

.preview-reason {
  font-size: 14.5px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.preview-reason.mine {
  color: var(--accent);
}

.preview-actions {
  margin-top: 16px;
}

.later-wrap {
  position: relative;
}

.later-pop {
  --pop-origin: top left;
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 6;
  display: flex;
  flex-direction: column;
  min-width: 188px;
}

@media (max-width: 760px) {
  .preview-head h2 {
    font-size: 22px;
  }

  .preview-actions button,
  .preview-actions a {
    min-height: 36px;
  }
}

@media (max-width: 760px) {
  .preview-head {
    padding: 12px 18px 18px;
  }
}
</style>

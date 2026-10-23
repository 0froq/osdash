<script setup lang="ts">
import type { UnitView } from '#shared/unit'
import { copy } from '~/copy/en'

const props = defineProps<{
  unit: UnitView | null
  viewer: string
  mobile: boolean
  /** True when the preview covers the list (phone sheet or tablet overlay). */
  backdrop: boolean
}>()

const emit = defineEmits<{
  close: []
  star: []
  later: [preset: string | null]
}>()

const timeline = useTimeline()
const drag = ref(0)
let startY = 0
let dragging = false

watch(
  () => props.unit?.id,
  id => {
    if (!id) {
      timeline.clear()
      return
    }
    void timeline.load(id)
  },
  { immediate: true },
)

watch(
  () => Boolean(props.unit) && props.mobile,
  locked => {
    if (!import.meta.client) return
    document.body.style.overflow = locked ? 'hidden' : ''
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

function onDown(event: PointerEvent): void {
  if (!props.mobile) return
  dragging = true
  startY = event.clientY
}

function onMove(event: PointerEvent): void {
  if (!dragging) return
  drag.value = Math.max(0, event.clientY - startY)
}

function onUp(): void {
  if (!dragging) return
  dragging = false
  if (drag.value > 80) emit('close')
  drag.value = 0
}
</script>

<template>
  <div
    class="preview-root"
    :class="{ open: unit !== null, sheet: mobile }"
  >
    <button
      v-if="unit && backdrop"
      class="preview-mask"
      type="button"
      :aria-label="copy.preview.close"
      @click="emit('close')"
    />
    <aside
      class="preview"
      :style="drag ? { transform: `translateY(${drag}px)` } : undefined"
    >
      <div
        v-if="unit === null"
        class="preview-empty"
      >
        {{ copy.preview.empty }}
      </div>
      <template v-else>
        <div
          class="preview-grab"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
        >
          <span class="grabber" />
        </div>
        <div class="preview-scroll">
          <PreviewHeader
            :unit="unit"
            @star="emit('star')"
            @later="emit('later', $event)"
          />
          <div
            v-if="timeline.pending.value && !timeline.payload.value"
            class="tl-skeleton"
            aria-hidden="true"
          >
            <span /><span /><span />
          </div>
          <p
            v-if="timeline.error.value"
            class="inbox-status error"
          >
            {{ copy.preview.failed }}
            <button
              type="button"
              @click="timeline.load(unit.id, true)"
              >{{ copy.preview.retry }}</button
            >
          </p>
          <Timeline
            v-if="timeline.payload.value"
            :entries="timeline.payload.value.entries"
            :viewer="viewer"
            :truncated="timeline.payload.value.truncated"
            :original-url="unit.url"
            :subject="{
              repo: unit.repo,
              number: unit.number,
              kind: unit.kind === 'issue-only' ? 'issue' : 'pr',
            }"
          />
        </div>
        <div class="preview-bar">
          <button
            type="button"
            @click="emit('later', 'tomorrow')"
            >{{ copy.menu.later }}</button
          >
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
      </template>
    </aside>
  </div>
</template>

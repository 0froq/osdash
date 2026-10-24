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
const closing = ref(false)
let startY = 0
let dragging = false

watch(
  () => props.unit?.id,
  id => {
    drag.value = 0
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
  if (drag.value > 80) {
    emit('close')
    return
  }
  drag.value = 0
}
</script>

<template>
  <div
    class="preview-root"
    :class="{ open: unit !== null || closing, sheet: mobile }"
  >
    <Transition name="mask">
      <button
        v-if="unit && backdrop"
        class="preview-mask"
        type="button"
        :aria-label="copy.preview.close"
        @click="emit('close')"
      />
    </Transition>
    <Transition
      :name="mobile ? 'sheet' : 'slide'"
      appear
      @before-leave="closing = true"
      @after-leave="closing = false"
    >
      <aside
        v-if="unit || !backdrop"
        class="preview"
        :style="drag ? { '--drag': `${drag}px` } : undefined"
      >
        <div
          v-if="unit === null"
          class="preview-empty"
        >
          {{ copy.preview.empty }}
        </div>
        <div
          v-else
          :key="unit.id"
          class="preview-body"
        >
          <div
            class="preview-grab"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onUp"
          >
            <span class="grabber" />
          </div>
          <PreviewHeader
            :unit="unit"
            @star="emit('star')"
            @later="emit('later', $event)"
          />
          <div class="preview-scroll">
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
              :key="timeline.payload.value.id"
              :entries="timeline.payload.value.entries"
              :items="timeline.payload.value.items ?? []"
              :unit="unit"
              :viewer="viewer"
              :truncated="timeline.payload.value.truncated"
              :original-url="unit.url"
            />
          </div>
        </div>
      </aside>
    </Transition>
  </div>
</template>

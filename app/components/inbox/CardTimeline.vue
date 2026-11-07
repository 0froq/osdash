<script setup lang="ts">
import type { UnitView } from '#shared/unit'
const { t } = useI18n()

const props = defineProps<{ unit: UnitView; viewer: string }>()
const timeline = useTimeline()
const root = ref<HTMLElement>()
const viewport = ref<HTMLElement>()
const content = ref<HTMLElement>()
const clipped = ref(false)
let observer: IntersectionObserver | undefined
let resize: ResizeObserver | undefined
const visible = ref(false)

onMounted(() => {
  observer = new IntersectionObserver(
    entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      visible.value = true
      observer?.disconnect()
    },
    { rootMargin: '200px' },
  )
  if (root.value) observer.observe(root.value)

  resize = new ResizeObserver(() => {
    clipped.value = Boolean(
      viewport.value && content.value && content.value.offsetHeight > viewport.value.clientHeight,
    )
  })
  if (viewport.value) resize.observe(viewport.value)
  if (content.value) resize.observe(content.value)
})

watch(
  () => [visible.value, props.unit.id, props.unit.lastActivityAt] as const,
  ([shown, id]) => {
    if (shown) void timeline.load(id)
  },
)

onBeforeUnmount(() => {
  observer?.disconnect()
  resize?.disconnect()
  timeline.clear()
})
</script>

<template>
  <div
    ref="root"
    class="card-timeline"
    :aria-busy="timeline.pending.value"
  >
    <div
      ref="viewport"
      class="timeline-viewport"
      :class="{ clipped }"
    >
      <div
        ref="content"
        class="timeline-content"
        :inert="clipped"
      >
        <Timeline
          v-if="timeline.payload.value"
          :key="timeline.payload.value.id"
          compact
          :entries="timeline.payload.value.entries"
          :items="timeline.payload.value.items ?? []"
          :unit="unit"
          :viewer="viewer"
          :truncated="timeline.payload.value.truncated"
          :original-url="unit.url"
          :notes="[]"
        />
        <p
          v-else
          class="timeline-status"
          :role="timeline.error.value ? 'status' : undefined"
        >
          {{ timeline.error.value ? t('preview.failed') : t('loading') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-timeline {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.timeline-viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: clip;
}

.timeline-viewport.clipped {
  mask-image: linear-gradient(to bottom, transparent, black 24px);
}

.timeline-content {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
}

.timeline-viewport:not(.clipped) .timeline-content {
  top: 0;
  bottom: auto;
}

.timeline-status {
  color: var(--muted);
  font-size: 12px;
}
</style>

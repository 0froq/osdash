<script setup lang="ts">
import { Drawer } from '@froq/ui'

const route = useRoute()
const { t } = useI18n()
const compact = ref(false)
const { open: navOpen, available, trigger: navTrigger } = useSectionNavigation()
let media: MediaQueryList | undefined

function syncViewport() {
  compact.value = media?.matches ?? false
  if (!compact.value) navOpen.value = false
}

onMounted(() => {
  media = window.matchMedia('(max-width: 1024px)')
  syncViewport()
  media.addEventListener('change', syncViewport)
  available.value = true
})
onBeforeUnmount(() => {
  media?.removeEventListener('change', syncViewport)
  available.value = false
  navOpen.value = false
})
watch(
  () => route.fullPath,
  () => {
    navOpen.value = false
  },
)

withDefaults(
  defineProps<{
    /** Open the section head. Closing it collapses the height so the body does not jump. */
    head?: boolean
  }>(),
  {
    head: true,
  },
)
</script>

<template>
  <div class="l-section-layout">
    <div
      v-if="!compact"
      class="l-section-nav"
    >
      <div class="l-section-nav-fixed">
        <slot name="nav" />
      </div>
    </div>
    <Drawer
      v-if="compact"
      id="section-navigation"
      v-model="navOpen"
      side="left"
      :show-trigger="false"
      :return-focus="navTrigger ?? undefined"
      :aria-label="t('nav.section')"
      :close-label="t('nav.close')"
      close-on-scroll-outside
      style="width: min(16rem, calc(100vw - 24px))"
    >
      <slot name="nav" />
    </Drawer>
    <div
      class="l-section-main"
      :class="{ 'is-plain': !head }"
    >
      <div
        class="l-head"
        :class="{ 'is-open': head }"
      >
        <div
          class="l-head-clip"
          :inert="head ? undefined : true"
        >
          <slot name="head" />
        </div>
      </div>
      <Transition
        name="section"
        mode="out-in"
      >
        <div
          :key="route.path"
          class="l-section-body"
        >
          <slot />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.l-section-layout {
  display: grid;
  /* Reserve equal side columns so the reading column stays centered in the viewport. */
  grid-template-columns:
    clamp(10.5rem, 16vw, 12rem) minmax(0, 1fr)
    clamp(10.5rem, 16vw, 12rem);
  align-items: start;
  gap: clamp(24px, 4vw, 56px);
  min-height: 100dvh;
  padding-inline: var(--pad);
}

/* The cell keeps the grid column. The inner box is fixed so the footer never pushes it away. */
.l-section-nav {
  min-width: 0;
}

.l-section-nav-fixed {
  position: fixed;
  top: var(--chrome-h, 0px);
  left: calc(var(--pad) - 8px);
  z-index: 5;
  box-sizing: border-box;
  /* Side room so focus rings and the active bar are not clipped by overflow. */
  width: calc(clamp(10.5rem, 16vw, 12rem) + 16px);
  height: calc(100dvh - var(--chrome-h, 0px));
  padding: 24px 8px;
  overflow: auto;
}

.l-section-main {
  padding-top: 48px;
  min-width: 0;
  transition: padding-top var(--ui-dur) var(--ui-ease);
}

.l-section-body {
  padding-top: clamp(48px, 8vh, 96px);
  transition: padding-top var(--ui-dur) var(--ui-ease);
}

.l-section-main.is-plain .l-section-body {
  padding-top: 0;
}

.l-head {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--ui-dur) var(--ui-ease);
}

.l-head.is-open {
  grid-template-rows: 1fr;
}

.l-head-clip {
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 1024px) {
  .l-section-layout {
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    gap: var(--gap);
  }

  .l-section-nav {
    display: none;
  }
}

/* Chained with .l-section-body so it outranks that rule's own padding-top transition. */
.l-section-body.section-enter-active,
.l-section-body.section-leave-active {
  transition:
    opacity 0.25s var(--ui-ease),
    transform 0.25s var(--ui-ease),
    padding-top var(--ui-dur) var(--ui-ease);
}

.l-section-body.section-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.l-section-body.section-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .l-section-body.section-enter-active,
  .l-section-body.section-leave-active {
    transition:
      opacity 0.25s var(--ui-ease),
      padding-top var(--ui-dur) var(--ui-ease);
  }

  .l-section-body.section-enter-from {
    transform: none;
  }
}
</style>

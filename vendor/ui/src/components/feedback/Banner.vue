<script setup lang="ts">
defineProps<{
  label: string
  dismissLabel?: string
}>()

const emit = defineEmits<{ dismiss: [] }>()
</script>

<template>
  <section
    class="ui-banner"
    :aria-label="label"
  >
    <div class="ui-banner-content">
      <slot />
    </div>
    <div
      v-if="$slots.actions || dismissLabel"
      class="ui-banner-actions"
    >
      <slot name="actions" />
      <button
        v-if="dismissLabel"
        type="button"
        class="ui-banner-dismiss"
        :aria-label="dismissLabel"
        @click="emit('dismiss')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </section>
</template>

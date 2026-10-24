<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  announcement?: 'polite' | 'assertive' | 'off'
  dismissLabel?: string
}>(), { announcement: 'polite' })
const emit = defineEmits<{ dismiss: [] }>()
</script>

<template>
  <div
    class="ui-alert"
    :role="props.announcement === 'off' ? undefined : props.announcement === 'assertive' ? 'alert' : 'status'"
    :aria-atomic="props.announcement === 'off' ? undefined : true"
  >
    <div class="ui-alert-content">
      <p
        v-if="title"
        class="ui-alert-title"
      >
        {{ title }}
      </p>
      <div class="ui-alert-description">
        <slot />
      </div>
    </div>
    <button
      v-if="dismissLabel"
      type="button"
      class="ui-alert-dismiss"
      :aria-label="dismissLabel"
      @click="emit('dismiss')"
    >
      <span aria-hidden="true">×</span>
    </button>
  </div>
</template>

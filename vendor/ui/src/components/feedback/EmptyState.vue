<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ title: string, description?: string }>()
defineSlots<{ default?: () => unknown, actions?: () => unknown }>()
const id = useId()
</script>

<template>
  <section
    class="ui-empty-state"
    :aria-labelledby="id"
  >
    <h2
      :id="id"
      class="ui-empty-state-title"
    >
      {{ title }}
    </h2>
    <p
      v-if="description"
      class="ui-empty-state-description"
    >
      {{ description }}
    </p>
    <slot />
    <div
      v-if="$slots.actions"
      class="ui-empty-state-actions"
    >
      <slot name="actions" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Pick } from '@froq/ui'
import type { PickOption } from '@froq/ui'

const { t } = useI18n()

const props = defineProps<{
  repos: Array<{ name: string; count: number }>
  active: string[]
  showOwn: boolean
}>()

const emit = defineEmits<{ select: [repos: string[]]; own: [shown: boolean] }>()

const options = computed<PickOption[]>(() =>
  props.repos.map(repo => ({ value: repo.name, label: repo.name, count: repo.count })),
)
const selected = computed({
  get: () => props.active,
  set: next => emit('select', next),
})
const empty = computed(() => props.active.length === 0)

function invert(): void {
  emit(
    'select',
    props.repos.map(repo => repo.name).filter(name => !props.active.includes(name)),
  )
}
</script>

<template>
  <Pick
    v-model="selected"
    class="repo-filter"
    :label="t('repos.label')"
    :options="options"
    :more-label="t('repos.showAll')"
    :less-label="t('repos.showLess')"
  >
    <template #extra>
      <button
        type="button"
        class="ui-pick-quiet"
        :disabled="empty"
        :aria-pressed="empty"
        @click="emit('select', [])"
      >
        {{ t('repos.all') }}
      </button>
      <button
        type="button"
        class="ui-pick-quiet"
        :disabled="empty"
        @click="invert"
      >
        {{ t('repos.invert') }}
      </button>
      <button
        type="button"
        class="ui-pick-quiet repo-own"
        :aria-pressed="showOwn"
        @click="emit('own', !showOwn)"
      >
        {{ t('repos.own') }}
      </button>
    </template>
  </Pick>
</template>

<style scoped>
.repo-filter {
  margin-top: 20px;
}

/* Own is a boolean toggle, not part of the selection; it rides the quiet
   control skin but keeps a pressed accent marker like a picked option. */
.repo-own::before {
  display: inline-block;
  width: 3px;
  height: 10px;
  border-radius: 1px;
  background: var(--line);
  content: '';
  align-self: center;
  transition: background-color var(--dur-2) var(--ease);
}

.repo-own[aria-pressed='true']::before {
  background: var(--accent);
}
</style>

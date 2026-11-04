<script setup lang="ts">
import type { PickOption } from '../../vue'
import { computed, ref } from 'vue'
import Pick from './Pick.vue'

const repos: PickOption[] = [
  { value: 'icons', label: 'antfu-collective/icons', count: 1 },
  { value: 'taze', label: 'antfu-collective/taze', count: 1 },
  { value: 'comarkdown', label: 'comarkdown/comark', count: 2 },
  { value: 'elyoffice', label: 'ELY-Open-Source/ElyOffice', count: 1 },
  { value: 'markdown-oxide', label: 'Feel-ix-343/markdown-oxide', count: 1 },
  { value: 'shiki', label: 'shikijs/shiki', count: 1 },
  { value: 'typora', label: 'typora/theme.typora.io', count: 1 },
  { value: 'launch-editor', label: 'vitejs/launch-editor', count: 1 },
  { value: 'void', label: 'voidzero-dev/void', count: 12 },
  { value: 'x18n', label: 'x18n-dev/x18n', count: 7 },
  { value: 'zed-i18n-lens', label: 'yizixu/zed-i18n-lens', count: 1 },
  { value: 'extensions', label: 'zed-industries/extensions', count: 1 },
]

const selected = ref<string[]>([])
const empty = computed(() => selected.value.length === 0)
const readout = computed(() =>
  empty.value ? 'all repositories' : `${selected.value.length} of ${repos.length}`,
)
</script>

<template>
  <div class="demo-grid">
    <Pick
      v-model="selected"
      label="Repository"
      :options="repos"
    >
      <template #extra>
        <button
          class="ui-pick-quiet"
          :disabled="empty"
          @click="selected = []"
        >
          All
        </button>
        <button
          class="ui-pick-quiet"
          :disabled="empty"
          @click="selected = repos.map(r => r.value).filter(v => !selected.includes(v))"
        >
          Invert
        </button>
      </template>
    </Pick>
    <div class="demo-value">
      <code>v-model: string[]</code>
      <span>2-row cap, extras via #extra · {{ readout }}</span>
    </div>
  </div>
</template>

<style scoped>
.demo-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 20px;
  align-items: start;
}

.demo-value {
  display: grid;
  gap: 4px;
  justify-items: start;
  padding-top: 3px;
  color: var(--ui-muted);
  font-size: 11px;
}

.demo-value code {
  color: var(--ui-fg);
  font-family: var(--ui-font-meta);
}

.demo-value span {
  font-family: var(--ui-font-meta);
}
</style>

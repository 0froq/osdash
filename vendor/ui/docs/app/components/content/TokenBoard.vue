<script setup lang="ts">
import type { TokenName } from '@froq/ui/core'
import { TOKENS, tokenVar } from '@froq/ui/core'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const COLOR = new Set<TokenName>(['bg', 'fg', 'muted', 'faint', 'line', 'accent'])
const root = ref<HTMLElement>()
const values = ref<Partial<Record<TokenName, string>>>({})

function read(): void {
  const el = root.value
  if (!el)
    return
  const style = getComputedStyle(el)
  const row: Partial<Record<TokenName, string>> = {}
  for (const name of TOKENS)
    row[name] = style.getPropertyValue(tokenVar(name)).trim()
  values.value = row
}

let observer: MutationObserver | undefined

onMounted(() => {
  read()
  observer = new MutationObserver(() => read())
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section
    ref="root"
    class="board ui"
  >
    <div
      v-for="token in TOKENS"
      :key="token"
      class="token-row"
    >
      <span
        class="swatch"
        :class="{ 'is-blank': !COLOR.has(token) }"
        :style="COLOR.has(token) ? { '--swatch': `var(${tokenVar(token)})` } : undefined"
      />
      <span>{{ tokenVar(token) }}</span>
      <span class="token-value">{{ values[token] }}</span>
    </div>
  </section>
</template>

<style scoped>
.board {
  margin: 1.4em 0 1.6em;
  padding: 22px 0 4px;
  background: transparent;
  color: var(--ui-fg);
  border-top: 1px solid var(--ui-line);
  font-family: var(--ui-font-text);
}

.token-row {
  display: grid;
  grid-template-columns: 16px minmax(120px, 180px) minmax(0, 1fr);
  gap: 10px;
  align-items: baseline;
  padding: 7px 0;
  border-top: 1px solid var(--ui-line);
  font-family: var(--ui-font-meta);
  font-size: 12px;
}

.swatch {
  width: 14px;
  height: 14px;
  border: 1px solid var(--ui-line);
  background: var(--swatch);
}

.swatch.is-blank {
  background: transparent;
  border-color: transparent;
}

.token-value {
  color: var(--ui-muted);
  overflow-wrap: anywhere;
}
</style>

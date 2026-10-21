<script setup lang="ts">
import { copy } from '~/copy/zh-CN'

defineProps<{
  name: string
  avatarUrl: string | null
  pending: boolean
}>()

const emit = defineEmits<{
  refresh: []
  logout: []
}>()

const open = ref(false)
const root = ref<HTMLElement>()
const { theme, ready, setTheme, onThemeKey } = useTheme()

function letter(name: string): string {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed.slice(0, 1).toUpperCase() : '?'
}

function onDocumentPointer(event: PointerEvent): void {
  const target = event.target
  if (!(target instanceof Node) || root.value?.contains(target)) return
  open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointer)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointer)
})
</script>

<template>
  <div
    ref="root"
    class="viewer-menu"
  >
    <button
      class="viewer-button"
      type="button"
      :aria-label="copy.avatarLabel(name)"
      :aria-expanded="open"
      @click="open = !open"
    >
      <img
        v-if="avatarUrl"
        class="avatar"
        :src="avatarUrl"
        alt=""
      />
      <span
        v-else
        class="avatar"
        aria-hidden="true"
        >{{ letter(name) }}</span
      >
      <span class="viewer-name">{{ name }}</span>
    </button>
    <div
      v-if="open"
      class="menu-pop"
      role="menu"
    >
      <button
        class="menu-item"
        type="button"
        role="menuitem"
        :disabled="pending"
        @click="emit('refresh')"
      >
        {{ pending ? copy.menu.refreshing : copy.menu.refresh }}
      </button>
      <div
        class="menu-theme"
        role="radiogroup"
        :aria-label="copy.menu.theme"
        @keydown="onThemeKey"
      >
        <button
          type="button"
          role="radio"
          :aria-checked="ready ? theme === 'light' : undefined"
          :tabindex="theme === 'dark' ? -1 : 0"
          @click="setTheme('light')"
        >
          {{ copy.menu.light }}
        </button>
        <button
          type="button"
          role="radio"
          :aria-checked="ready ? theme === 'dark' : undefined"
          :tabindex="theme === 'light' ? -1 : 0"
          @click="setTheme('dark')"
        >
          {{ copy.menu.dark }}
        </button>
      </div>
      <button
        class="menu-item"
        type="button"
        role="menuitem"
        @click="emit('logout')"
      >
        {{ copy.menu.logout }}
      </button>
      <p class="menu-shortcuts">{{ copy.shortcutsLabel }} {{ copy.shortcuts }}</p>
    </div>
  </div>
</template>

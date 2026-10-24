<script setup lang="ts">
import { copy } from '~/copy/en'

defineProps<{
  name: string
  avatarUrl: string | null
  pending: boolean
}>()

const emit = defineEmits<{
  refresh: []
  logout: []
  settings: []
}>()

const open = ref(false)
const root = ref<HTMLElement>()
const { theme, ready, setTheme, onThemeKey } = useTheme()

function openSettings(): void {
  open.value = false
  emit('settings')
}

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
    <PopMenu
      v-if="open"
      class="menu-pop"
    >
      <button
        class="menu-item pop-item"
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
        class="menu-item pop-item"
        type="button"
        role="menuitem"
        @click="openSettings"
      >
        {{ copy.settings.title }}
      </button>
      <button
        class="menu-item pop-item"
        type="button"
        role="menuitem"
        @click="emit('logout')"
      >
        {{ copy.menu.logout }}
      </button>
      <p class="menu-shortcuts">{{ copy.shortcutsLabel }} {{ copy.shortcuts }}</p>
    </PopMenu>
  </div>
</template>

<style scoped>
.viewer-menu {
  position: relative;
  margin-top: auto;
}

.viewer-button {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 40px;
  padding: 6px 10px;
  border: 0;
  border-radius: var(--radius-row);
  cursor: pointer;
  text-align: left;
  transition: background-color var(--dur-1) var(--ease);
}

.viewer-button:hover {
  background: var(--soft);
}

.avatar {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 26px;
  height: 26px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--faint);
  color: var(--fg);
  font-family: var(--font-meta);
  font-size: 12px;
}

img.avatar {
  object-fit: cover;
}

.viewer-name {
  overflow: hidden;
  font-size: 13.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-pop {
  --pop-origin: bottom left;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  min-width: 208px;
}

.menu-theme {
  display: flex;
  gap: 2px;
  margin: 4px 6px;
  padding: 2px;
  border: 1px solid var(--line);
  border-radius: 6px;
}

.menu-theme button {
  flex: 1;
  min-height: 26px;
  border: 0;
  border-radius: 4px;
  color: var(--muted);
  cursor: pointer;
  font-size: 12.5px;
  transition:
    background-color var(--dur-1) var(--ease),
    color var(--dur-1) var(--ease);
}

.menu-theme button:hover {
  color: var(--fg);
}

.menu-theme button[aria-checked='true'] {
  background: var(--soft-2);
  color: var(--fg);
}

.menu-shortcuts {
  margin: 0;
  padding: 8px 10px 6px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11.5px;
  line-height: 1.5;
}

@media (max-width: 760px) {
  .menu-shortcuts {
    display: none;
  }
}
</style>

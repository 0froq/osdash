<script setup lang="ts">
import type { MenuItem } from '@froq/ui/vue'
import { Menu } from '@froq/ui'
import { copy } from '~/copy/en'

const props = defineProps<{
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
const { theme, ready, setTheme } = useTheme()

const items = computed<MenuItem[]>(() => [
  {
    value: 'refresh',
    label: props.pending ? copy.menu.refreshing : copy.menu.refresh,
    disabled: props.pending,
  },
  { value: 'theme-light', label: copy.menu.light, separatorBefore: true },
  { value: 'theme-dark', label: copy.menu.dark },
  { value: 'settings', label: copy.settings.title, separatorBefore: true },
  { value: 'logout', label: copy.menu.logout },
])

function select(item: MenuItem): void {
  if (item.value === 'refresh') emit('refresh')
  else if (item.value === 'settings') emit('settings')
  else if (item.value === 'logout') emit('logout')
  else if (item.value === 'theme-light') setTheme('light')
  else if (item.value === 'theme-dark') setTheme('dark')
}

/**
 * The library's Menu does not turn the layer's dismiss event into a close, so
 * Escape has to close it here. The listener only runs while the sheet is open.
 */
function onKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !open.value) return
  open.value = false
}

onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))

function letter(name: string): string {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed.slice(0, 1).toUpperCase() : '?'
}
</script>

<template>
  <div class="viewer-menu">
    <Menu
      v-model="open"
      class="osdash-menu"
      :label="copy.avatarLabel(name)"
      :items="items"
      side="top"
      align="start"
      @select="select"
    >
      <template #trigger>
        <button
          class="viewer-button"
          type="button"
          :aria-label="copy.avatarLabel(name)"
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
      </template>
      <template #item="{ item }">
        <span
          :aria-current="
            ready &&
            ((item.value === 'theme-light' && theme === 'light') ||
              (item.value === 'theme-dark' && theme === 'dark'))
              ? 'true'
              : undefined
          "
          >{{ item.label }}</span
        >
      </template>
    </Menu>
    <p class="menu-shortcuts">{{ copy.shortcutsLabel }} {{ copy.shortcuts }}</p>
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

.menu-shortcuts {
  margin: 0;
  padding: 8px 10px 6px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11.5px;
  line-height: 1.5;
}
</style>

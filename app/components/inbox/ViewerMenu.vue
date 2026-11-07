<script setup lang="ts">
import type { MenuItem } from '@froq/ui/vue'
import { Avatar, Menu } from '@froq/ui'
const { t } = useI18n()

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

const items = computed<MenuItem[]>(() => [
  {
    value: 'refresh',
    label: props.pending ? t('menu.refreshing') : t('menu.refresh'),
    disabled: props.pending,
  },
  { value: 'settings', label: t('settings.title'), separatorBefore: true },
  { value: 'logout', label: t('menu.logout') },
])

function select(item: MenuItem): void {
  if (item.value === 'refresh') emit('refresh')
  else if (item.value === 'settings') emit('settings')
  else if (item.value === 'logout') emit('logout')
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
  <Menu
    v-model="open"
    class="osdash-menu"
    :label="t('avatarLabel', { name })"
    :items="items"
    side="bottom"
    align="end"
    @select="select"
  >
    <template #trigger>
      <button
        type="button"
        class="viewer-button"
        :aria-label="t('avatarLabel', { name })"
        :title="name"
      >
        <Avatar
          class="viewer-avatar"
          :label="name"
          :fallback="letter(name)"
          :src="avatarUrl || undefined"
          loading="eager"
        />
      </button>
    </template>
    <template #item="{ item }">
      <span>{{ item.label }}</span>
    </template>
  </Menu>
</template>

<style scoped>
.viewer-button {
  display: inline-flex;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
}

.viewer-button:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 3px;
}

.viewer-avatar {
  width: 28px;
  height: 28px;
}
</style>

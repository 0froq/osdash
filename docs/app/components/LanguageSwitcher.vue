<script setup lang="ts">
import type { ChoiceOption } from '@froq/ui'
import { ScrollSelect } from '@froq/ui'

const { t, locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

type Code = typeof locale.value

const pending = ref(false)
const options = computed<ChoiceOption[]>(() =>
  locales.value.map(item => ({ value: item.code, label: item.name ?? item.code })),
)
const languages = computed(() => new Map(locales.value.map(item => [item.code, item.language])))

// The route owns the language. A change the router does not take leaves the model where it was,
// and the control scrolls back to it when `pending` ends.
async function go(code: Code) {
  if (pending.value) return
  pending.value = true
  try {
    const path = switchLocalePath(code)
    if (path) await navigateTo(path)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ScrollSelect
    class="language-switcher"
    :model-value="locale"
    :label="t('nav.language')"
    :options="options"
    :pending="pending"
    wheel="hover"
    hide-label
    @update:model-value="go($event as Code)"
  >
    <template #option="{ option }">
      <span :lang="languages.get(option.value as Code)">{{ option.label }}</span>
    </template>
  </ScrollSelect>
</template>

<style scoped>
.language-switcher {
  flex-shrink: 0;
}
</style>

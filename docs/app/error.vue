<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const link = useSiteLink()

usePaperOgImage({
  title: () => t('notFound.title'),
  description: () => props.error.statusMessage || props.error.message,
})
</script>

<template>
  <NuxtLayout>
    <div class="l-sheet">
      <PageHead
        :kicker="String(error.statusCode ?? 404)"
        :title="t('notFound.title')"
        :lede="error.statusMessage || error.message"
        long
      >
        <template #meta>
          <NuxtLink
            class="l-cta"
            :to="link('/')"
            @click.prevent="clearError({ redirect: link('/') })"
          >
            {{ t('notFound.back') }}
          </NuxtLink>
        </template>
      </PageHead>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.l-sheet {
  position: relative;
  z-index: 0;
}
</style>

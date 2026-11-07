<script setup lang="ts">
import { Skeleton } from '@froq/ui'

const { t } = useI18n()
const cards = [
  { kicker: '38%', title: '82%', meta: '54%' },
  { kicker: '30%', title: '64%', meta: '46%' },
  { kicker: '42%', title: '74%', meta: '60%' },
]
</script>

<template>
  <div
    class="inbox-skeleton"
    role="status"
  >
    <span class="visually-hidden">{{ t('loading') }}</span>
    <div
      class="skeleton-greeting"
      aria-hidden="true"
    >
      <Skeleton
        class="greeting-title"
        height="44px"
      />
      <Skeleton
        class="greeting-stats"
        shape="text"
        height="18px"
      />
    </div>
    <section
      class="skeleton-section"
      aria-hidden="true"
    >
      <Skeleton
        shape="text"
        width="110px"
        height="18px"
      />
      <div class="skeleton-list">
        <article
          v-for="(card, index) in cards"
          :key="index"
          class="skeleton-card"
        >
          <div class="skeleton-info">
            <Skeleton
              shape="text"
              :width="card.kicker"
              height="14px"
            />
            <Skeleton
              :width="card.title"
              height="22px"
            />
            <Skeleton
              shape="text"
              :width="card.meta"
              height="16px"
            />
          </div>
          <div class="skeleton-rail">
            <div
              v-for="row in 3"
              :key="row"
              class="rail-row"
            >
              <Skeleton
                shape="circle"
                width="8px"
                height="8px"
              />
              <Skeleton
                shape="text"
                :width="`${72 - row * 12}%`"
                height="14px"
              />
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Skeleton reserves 1lh when it has no slot. That stretches the 8px dots into
   ovals and makes short bars taller than the text they stand in for. The
   extra class beats the library's own :not(.has-content) rule. */
:deep(.ui-skeleton.is-loading) {
  min-height: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.skeleton-greeting {
  display: grid;
  gap: 8px;
}

.greeting-title {
  width: min(360px, 70%);
}

.greeting-stats {
  width: min(300px, 56%);
}

.skeleton-section {
  display: grid;
  gap: 16px;
  margin-top: 30px;
}

.skeleton-list {
  display: grid;
  gap: 12px;
}

/* Same geometry as UnitCard: hairline ring, info column and a rail column. */
.skeleton-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, min(421px, 58%));
  gap: 7px 32px;
  margin-inline: -14px;
  padding: 16px 20px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px var(--line);
}

.skeleton-info {
  display: grid;
  gap: 10px;
  align-content: start;
}

.skeleton-rail {
  display: grid;
  gap: 14px;
  align-content: center;
  padding-left: 16px;
  border-left: 1px solid var(--line);
}

.rail-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

@media (max-width: 780px) {
  .skeleton-card {
    grid-template-columns: minmax(0, 1fr);
    margin-inline: 0;
    padding: 15px 16px 14px;
  }

  .skeleton-rail {
    display: none;
  }
}
</style>

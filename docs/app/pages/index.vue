<script setup lang="ts">
import { Choice, Toggle } from '@froq/ui'

const { t } = useI18n()
const link = useSiteLink()
const tone = ref('clear')
const enabled = ref(true)
const catalog = componentCatalog()
const count = catalog.reduce((total, concept) => total + concept.items.length, 0)
const options = computed(() => ['quiet', 'clear', 'loud'].map(value => ({ value, label: t(`hero.${value}`) })))

usePaperOgImage({
  title: 'froq/ui',
  description: () => t('hero.lede'),
}, { title: 'froq/ui' })
</script>

<template>
  <div class="home-sheet">
    <section class="home-intro">
      <div class="home-identity">
        <p class="home-eyebrow">
          {{ t('hero.tagline') }}
        </p>
        <h1>froq/ui<span>.</span></h1>
        <p class="home-lede">
          {{ t('hero.lede') }}
        </p>
        <div class="home-actions">
          <NuxtLink
            class="l-cta"
            :to="link('/components')"
          >
            {{ t('hero.browse') }}
          </NuxtLink>
          <NuxtLink :to="link('/docs')">
            {{ t('hero.cta') }}
          </NuxtLink>
        </div>
      </div>
      <figure class="home-specimen">
        <figcaption class="home-specimen-caption">
          <span>{{ t('hero.specimen') }}</span>
          <span aria-hidden="true">01 / 02</span>
        </figcaption>
        <div class="home-sample">
          <p class="home-sample-name">
            Choice
          </p>
          <Choice
            v-model="tone"
            :label="t('hero.tone')"
            :options="options"
          />
          <p
            class="home-readout"
            aria-live="polite"
          >
            {{ t('hero.selected') }}: {{ options.find(option => option.value === tone)?.label }}
          </p>
        </div>
        <div class="home-sample home-switch">
          <p class="home-sample-name">
            Toggle
          </p>
          <p class="home-sentence">
            {{ t('hero.switchBefore') }}
            <Toggle
              v-model="enabled"
              :label="t('hero.switchLabel')"
              :on-label="t('hero.on')"
              :off-label="t('hero.off')"
            />.
          </p>
        </div>
        <ComponentStatus />
      </figure>
    </section>
    <aside class="home-draft">
      <ComponentStatus explain />
    </aside>
    <section
      class="home-index"
      aria-labelledby="library-title"
    >
      <div class="home-section-head">
        <h2 id="library-title">
          {{ t('hero.index') }}
        </h2>
        <p>{{ t('components.count', { n: count }) }}</p>
      </div>
      <p class="home-index-description">
        {{ t('hero.indexDescription') }}
      </p>
      <div class="home-concepts">
        <NuxtLink
          v-for="concept in catalog"
          :key="concept.id"
          class="home-concept"
          :to="link(`/components/${concept.id}`)"
        >
          <span>{{ concept.id }}</span>
          <span class="home-concept-count">{{ concept.items.length }}</span>
        </NuxtLink>
      </div>
    </section>
    <section class="home-foundation">
      <h2>{{ t('hero.contract') }}</h2>
      <div>
        <p>{{ t('hero.contractDescription') }}</p>
        <NuxtLink
          class="l-cta"
          :to="link('/docs/tokens')"
        >
          {{ t('hero.contractLink') }}
        </NuxtLink>
      </div>
      <pre><code>import '@froq/ui/style.css'
import { Choice, Toggle } from '@froq/ui'</code></pre>
    </section>
  </div>
</template>

<style scoped>
.home-sheet {
  max-width: 1680px;
  margin: 0 auto;
  padding: clamp(144px, 18vh, 220px) var(--pad) 72px;
}

.home-intro {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: clamp(40px, 7vw, 120px);
  align-items: center;
  padding-bottom: clamp(56px, 8vh, 100px);
}

.home-eyebrow,
.home-specimen-caption,
.home-sample-name,
.home-readout,
.home-section-head > p,
.home-concept-count {
  font-family: var(--ui-font-meta);
  font-size: 11px;
  font-weight: 400;
  color: var(--ui-muted);
}

.home-eyebrow {
  margin: 0 0 28px;
}

h1 {
  margin: 0 0 32px -0.04em;
  font-family: var(--ui-font-display);
  font-weight: 400;
  font-size: calc(clamp(88px, 13vw, 208px) * var(--display-scale));
  line-height: 0.85;
  letter-spacing: -0.045em;
}

h1 > span {
  color: var(--ui-accent);
}

.home-lede {
  max-width: 28rem;
  margin: 0;
  color: var(--ui-muted);
  font-size: clamp(16px, 1.3vw, 19px);
}

.home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 28px;
  margin-top: 32px;
  align-items: baseline;
  font-size: 14px;
}

.home-actions > a:last-child {
  color: var(--ui-muted);
}

.home-specimen {
  min-width: 0;
  margin: 0;
  padding: 24px clamp(20px, 3vw, 40px);
  border: 1px solid var(--ui-line);
  background: color-mix(in srgb, var(--ui-bg) 65%, transparent);
}

.home-specimen-caption {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--ui-line);
}

.home-sample {
  padding: 24px 0;
}

.home-sample-name {
  margin: 0 0 20px;
}

.home-readout {
  margin: 20px 0 0;
}

.home-switch {
  border-top: 1px solid var(--ui-line);
}

.home-sentence {
  margin: 0;
  font-family: var(--ui-font-display);
  font-size: clamp(24px, 2.5vw, 36px);
  line-height: 1.5;
}

.home-draft {
  padding: 16px 0;
  border-block: 1px solid var(--ui-line);
}

.home-index {
  padding: 56px 0;
}

.home-section-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
}

h2 {
  margin: 0;
  font-family: var(--ui-font-display);
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 400;
  line-height: 1.2;
}

.home-section-head > p {
  margin: 0;
}

.home-index-description {
  margin: 16px 0 28px;
  max-width: 38rem;
  color: var(--ui-muted);
  font-size: 14px;
}

.home-concepts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 32px;
}

.home-concept {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  padding: 14px 0;
  border-top: 1px solid var(--ui-line);
  transition: color var(--ui-dur) var(--ui-ease);
}

.home-concept:hover {
  color: var(--ui-accent);
}

.home-foundation {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1fr) minmax(0, 1.3fr);
  align-items: start;
  gap: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--ui-line);
}

.home-foundation p {
  margin: 0 0 20px;
  color: var(--ui-muted);
  font-size: 14px;
}

.home-foundation pre {
  min-width: 0;
  margin: 0;
  padding: 20px;
  overflow-x: auto;
  background: var(--ui-faint);
  font-size: 13px;
  line-height: 1.9;
}

@media (max-width: 1000px) {
  .home-intro {
    gap: 32px;
  }

  .home-foundation {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .home-foundation h2 {
    grid-column: 1 / -1;
  }
}

@media (max-width: 700px) {
  .home-sheet {
    padding-top: 144px;
  }

  .home-intro,
  .home-foundation {
    grid-template-columns: minmax(0, 1fr);
  }

  .home-intro {
    gap: 40px;
  }

  h1 {
    font-size: calc(clamp(80px, 20vw, 140px) * var(--display-scale));
  }

  .home-concepts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 24px;
  }
}
</style>

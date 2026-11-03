<script setup lang="ts">
import { Paper } from '@froq/ui'

const { t, locale, locales } = useI18n()
const link = useSiteLink()
const switchLocalePath = useSwitchLocalePath()
const { ready, next, toggle } = useTheme()
const others = computed(() => locales.value.filter(item => item.code !== locale.value))
const year = new Date().getFullYear()
</script>

<template>
  <Paper class="l-foot">
    <footer class="l-foot-inner">
      <div class="l-foot-board">
        <section
          class="l-foot-about"
          aria-labelledby="foot-about"
        >
          <h2 id="foot-about">
            {{ t('site.foot.about') }}
          </h2>
          <i18n-t
            keypath="site.foot.aboutText"
            tag="p"
            scope="global"
          >
            <template #geist>
              <a
                href="https://vercel.com/font"
                target="_blank"
                rel="noopener noreferrer"
                >Geist</a
              >
            </template>
            <template #instrument>
              <a
                href="https://fonts.google.com/specimen/Instrument+Serif"
                target="_blank"
                rel="noopener noreferrer"
                >Instrument Serif</a
              >
            </template>
          </i18n-t>
        </section>
        <section aria-labelledby="foot-site">
          <h2 id="foot-site">
            {{ t('site.foot.site') }}
          </h2>
          <ul>
            <li>
              <NuxtLink :to="link('/docs')">
                {{ t('nav.docs') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="link('/components')">
                {{ t('nav.components') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="link('/changelog')">
                {{ t('nav.changelog') }}
              </NuxtLink>
            </li>
          </ul>
        </section>
        <section aria-labelledby="foot-elsewhere">
          <h2 id="foot-elsewhere">
            {{ t('site.foot.elsewhere') }}
          </h2>
          <ul>
            <li>
              <a
                href="https://github.com/0froq/ui"
                target="_blank"
                rel="noopener noreferrer"
                >GitHub</a
              >
            </li>
            <li>
              <a
                href="https://froq.me"
                target="_blank"
                rel="noopener noreferrer"
                >froQ</a
              >
            </li>
            <li>
              <a
                href="https://lig.froq.me"
                target="_blank"
                rel="noopener noreferrer"
                >LiG</a
              >
            </li>
          </ul>
        </section>
        <section aria-labelledby="foot-prefs">
          <h2 id="foot-prefs">
            {{ t('site.foot.prefs') }}
          </h2>
          <ul>
            <li
              v-for="item in others"
              :key="item.code"
            >
              <NuxtLink
                :to="switchLocalePath(item.code)"
                :lang="item.language"
                >{{ item.name }}</NuxtLink
              >
            </li>
            <li v-if="ready">
              <button
                type="button"
                @click="toggle"
              >
                {{ t(`theme.${next}`) }}
              </button>
            </li>
          </ul>
        </section>
      </div>
      <p
        class="l-foot-mark"
        aria-hidden="true"
      >
        froq/ui<span class="l-foot-stop">.</span>
      </p>
      <p class="l-foot-legal">
        <span>© {{ year }} froQ</span>
        <a
          href="https://github.com/0froq/ui/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
          >{{ t('site.foot.license') }}</a
        >
      </p>
    </footer>
  </Paper>
</template>

<style scoped>
/* Above the fixed section nav, so the nav slides under the footer instead of over it. */
.l-foot {
  position: relative;
  z-index: 10;
  margin-top: 48px;
}

/* Fade from the page into the paper. */
.l-foot::before {
  content: '';
  position: absolute;
  inset: auto 0 100%;
  height: 48px;
  background: linear-gradient(to top, var(--ui-bg), transparent);
  pointer-events: none;
}

.l-foot-inner {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  padding: clamp(48px, 8svh, 96px) var(--pad) clamp(20px, 3svh, 32px);
  overflow: clip;
  color: var(--ui-muted);
  font-size: 13px;
}

.l-foot h2 {
  margin: 0 0 16px;
  color: var(--ui-muted);
  font: 400 11px/1.4 var(--ui-font-meta);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.l-foot-board {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
  gap: 32px clamp(24px, 4cqi, 48px);
  padding-top: 20px;
  border-top: 1px solid var(--ui-line);
}

.l-foot ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.l-foot li + li {
  margin-top: 6px;
}

.l-foot-board a,
.l-foot-board button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--ui-fg);
  font: inherit;
  font-size: 15px;
  line-height: 1.5;
  cursor: pointer;
}

.l-foot-about p {
  margin: 0;
  max-width: 34ch;
  color: var(--ui-muted);
  font-family: var(--ui-font-display);
  font-size: clamp(18px, 1.75cqi, 22px);
  line-height: 1.3;
  letter-spacing: -0.01em;
  text-wrap: pretty;
}

.l-foot a,
.l-foot button {
  transition: color 0.3s var(--ui-ease);
}

.l-foot a:hover,
.l-foot button:hover {
  color: var(--ui-accent);
}

.l-foot a:focus-visible,
.l-foot button:focus-visible {
  outline: 1px solid var(--ui-accent);
  outline-offset: 3px;
}

/* The name fills the frame and sits on the last rule like a word on a baseline. */
.l-foot-mark {
  margin: clamp(48px, 10svh, 112px) 0 0;
  color: var(--ui-fg);
  font-family: var(--ui-font-display);
  font-size: 26cqi;
  font-weight: 400;
  line-height: 0.78;
  letter-spacing: -0.045em;
  white-space: nowrap;
}

.l-foot-stop {
  color: var(--ui-accent);
}

.l-foot-legal {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin: 14px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--ui-line);
  font: 12px/1.5 var(--ui-font-meta);
}

.l-foot-legal span {
  margin-inline-end: auto;
}

:is(:lang(zh), :lang(ja)) .l-foot-about p {
  letter-spacing: 0;
  line-height: 1.45;
}

@media (max-width: 860px) {
  .l-foot-board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .l-foot-about {
    grid-column: 1 / -1;
  }
}
</style>

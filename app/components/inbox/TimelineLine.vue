<script setup lang="ts">
import { copy } from '~/copy/en'
import type { StoryLine } from '~/utils/story'

const props = defineProps<{
  line: StoryLine
  minor: boolean
  compact?: boolean
  nowMs: number
  /** Number shown as `on #N` when the line is not on the card's own item. */
  elsewhere: number | null
  /** Lane label that replaces an opened line. */
  rail?: {
    kind: 'pr' | 'issue'
    login: string
    who: string
    number: number
    url: string
    title: string
    lane: number
  } | null
  /** A long comment is collapsed until opened. */
  open?: boolean
  expandable?: boolean
}>()

const emit = defineEmits<{ toggle: [] }>()

const who = computed(() => {
  if (props.line.actor === 'checks') return ''
  return props.line.self ? copy.story.you : props.line.actor
})

function person(login: string | null | undefined, avatar?: string | null, href?: string | null) {
  if (!login || login === 'ghost') return null
  const name = login.replace(/\[bot\]$/, '')
  return {
    href: href || `https://github.com/${login.includes('[bot]') ? `apps/${name}` : login}`,
    avatar: avatar || `https://github.com/${name}.png?size=64`,
  }
}

const linePerson = computed(() => person(props.line.login, props.line.avatar, props.line.profile))
const railPerson = computed(() => person(props.rail?.login))

const long = computed(() => Boolean(props.line.body))
const box = ref<HTMLElement | null>(null)
const full = ref(0)
const shut = 34

function measure(): void {
  const inner = box.value?.firstElementChild
  if (inner instanceof HTMLElement) full.value = inner.offsetHeight
}

watch(
  () => props.open,
  () => nextTick(measure),
)
watch(
  () => props.line.body,
  () => nextTick(measure),
)
onMounted(() => nextTick(measure))
</script>

<template>
  <div
    class="st-text"
    :class="[`tone-${line.tone}`, { minor, reason: line.reason, rail: Boolean(rail) }]"
    :style="rail ? { '--lane': String(rail.lane) } : undefined"
  >
    <span
      v-if="rail"
      class="st-rail-mark"
      aria-hidden="true"
    >
      <KindIcon :kind="rail.kind" />
    </span>
    <p
      v-if="rail"
      class="st-head"
    >
      <span class="st-rail-line">
        <a
          v-if="railPerson"
          class="st-person"
          :href="railPerson.href"
          target="_blank"
          rel="noreferrer"
        >
          <img
            class="st-avatar"
            :src="railPerson.avatar"
            alt=""
          />
          <span class="st-who">{{ rail.who }}</span>
        </a>
        <span
          v-else
          class="st-who"
          >{{ rail.who }}</span
        >
        <span>{{ copy.story.openedItem }}</span>
        <a
          class="st-num"
          :href="rail.url"
          :title="rail.title || undefined"
          target="_blank"
          rel="noreferrer"
          >#{{ rail.number }}</a
        >
      </span>
      <TimelineTime
        :at="new Date(line.at).toISOString()"
        :now-ms="nowMs"
        :url="line.url"
      />
    </p>
    <component
      :is="expandable ? 'button' : 'p'"
      v-else
      :type="expandable ? 'button' : undefined"
      class="st-head"
      :class="{ 'st-line-hit': expandable }"
      :aria-expanded="expandable ? open : undefined"
      @click="expandable && emit('toggle')"
    >
      <span class="st-title">
        <a
          v-if="linePerson"
          class="st-person"
          :href="linePerson.href"
          target="_blank"
          rel="noreferrer"
          @click.stop
        >
          <img
            class="st-avatar"
            :src="linePerson.avatar"
            alt=""
          />
          <span class="st-who">{{ who }}</span>
        </a>
        <span
          v-else-if="who"
          class="st-who"
          >{{ who }}</span
        >
        <span class="st-verb"> {{ line.verb }}</span>
        <span
          v-if="line.label"
          class="st-label"
          :style="{ '--label': `#${line.label.color}` }"
          >{{ line.label.name }}</span
        >
        <a
          v-if="line.ref"
          class="st-ref"
          :href="line.ref.url"
          target="_blank"
          rel="noreferrer"
          >#{{ line.ref.number }}</a
        >
        <span
          v-for="tag in line.tags"
          :key="tag"
          class="st-tag"
          :class="`t-${tag}`"
          >{{ copy.story.tag[tag] }}</span
        >
      </span>
      <TimelineTime
        :at="new Date(line.at).toISOString()"
        :now-ms="nowMs"
        :url="line.url"
      />
    </component>
    <div
      v-if="long"
      ref="box"
      class="st-long"
      :class="{ open }"
      :style="{ height: `${open && full ? full : shut}px` }"
    >
      <div class="st-long-in">
        <p
          v-if="!open"
          class="st-long-line"
        >
          {{ line.quote }}
        </p>
        <MarkdownBody
          v-else
          :source="line.body!"
          :base-url="line.url ?? undefined"
        />
      </div>
    </div>
    <p
      v-else-if="!rail && line.quote && !minor"
      class="st-quote"
    >
      {{ line.quote }}
    </p>
    <p
      v-else-if="!rail && (line.quote || line.detail)"
      class="st-detail"
    >
      {{ line.quote ?? line.detail }}
    </p>
    <p
      v-if="!rail && line.chips.length"
      class="st-chips"
    >
      <span
        v-for="chip in line.chips"
        :key="chip"
        >{{ chip }}</span
      >
    </p>
  </div>
</template>

<style scoped>
button.st-head {
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
}

button.st-head:focus-visible {
  outline: none;
}

.st-head {
  display: flex;
  gap: 0 6px;
  align-items: center;
  font-size: 13px;
  line-height: 20px;
}

.st-title,
.st-rail-line {
  display: inline-flex;
  min-width: 0;
  gap: 0 6px;
  align-items: center;
}

.st-title {
  margin: 0 -6px;
  padding: 1px 6px;
  border-radius: 8px;
  transition: background-color var(--dur-2) var(--ease);
}

button.st-head:hover .st-title,
button.st-head:focus-visible .st-title {
  background: color-mix(in oklab, var(--fg) 6%, transparent);
}

.st-who {
  overflow: hidden;
  color: var(--fg);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.st-text.rail .st-head {
  color: var(--muted);
}

.st-rail-mark {
  position: absolute;
  z-index: 2;
  left: calc(var(--lane) * var(--st-col) + (var(--st-col) - 1.15cap) / 2);
  top: 14px;
  display: flex;
  border-radius: 50%;
  background: var(--st-paper, var(--bg));
  box-shadow: 0 0 0 3px var(--st-paper, var(--bg));
  transform: translateY(-50%);
}

.st-num,
.st-ref {
  border-bottom: 1px solid color-mix(in oklab, currentColor 28%, transparent);
  color: var(--fg);
  font-family: var(--font-meta);
  font-weight: 500;
  line-height: 1.1;
  text-decoration: none;
  transition: border-color var(--dur-2) var(--ease);
}

.st-num:hover,
.st-num:focus-visible,
.st-ref:hover,
.st-ref:focus-visible {
  border-bottom-color: currentColor;
}

.st-state {
  font-family: var(--font-meta);
  font-size: 10.5px;
  letter-spacing: 0.03em;
}

.st-state.s-open {
  color: var(--fg);
}

.st-state.s-merged {
  color: var(--good);
}

.st-person {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  color: inherit;
  text-decoration: none;
}

.st-who {
  border-bottom: 1px solid color-mix(in oklab, currentColor 28%, transparent);
  line-height: 1.1;
  transition: border-color var(--dur-2) var(--ease);
}

.st-person:hover .st-who,
.st-person:focus-visible .st-who {
  border-bottom-color: currentColor;
}

.st-avatar {
  width: 1.35em;
  height: 1.35em;
  border-radius: 50%;
  border: 1px solid var(--line);
}

.tone-bad .st-verb {
  color: var(--st-bad);
}

.tone-good .st-verb {
  color: var(--st-good);
}

.st-tag {
  font-family: var(--font-meta);
  font-size: 10.5px;
}

.st-on {
  color: var(--muted);
}

.st-label {
  padding: 0 7px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--label) 18%, transparent);
  color: var(--label);
  font-family: var(--font-meta);
  font-size: 11px;
  font-weight: 500;
  line-height: 18px;
}

.st-tag {
  padding: 0 6px;
  border: 1px solid var(--line);
  border-radius: 99px;
  color: var(--muted);
  line-height: 16px;
}

.st-quote {
  margin-top: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--st-soft);
  font-size: 13.5px;
  line-height: 1.55;
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

.st-text.reason .st-quote {
  background: color-mix(in oklab, var(--fg) 7%, transparent);
}

.turn-you .st-text.reason .st-quote {
  background: color-mix(in oklab, var(--accent) 9%, transparent);
}

.st-detail {
  overflow: hidden;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.st-long {
  overflow: hidden;
  margin-top: 6px;
  border-radius: 10px;
  background: var(--st-soft);
  transition: height var(--dur-3) var(--ease);
}

.st-text.reason .st-long {
  background: color-mix(in oklab, var(--fg) 7%, transparent);
}

.turn-you .st-text.reason .st-long {
  background: color-mix(in oklab, var(--accent) 9%, transparent);
}

.st-long-in {
  padding: 8px 12px;
  font-size: 13.5px;
  line-height: 1.55;
}

.st-long-line {
  overflow: hidden;
  margin: 0;
  color: var(--muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.st-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.st-chips span {
  padding: 1px 7px;
  border: 1px solid var(--line);
  border-radius: 99px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 10.5px;
}

.st-text.minor .st-head {
  color: var(--muted);
}

.st-text.minor .st-tag {
  line-height: 14px;
}
</style>

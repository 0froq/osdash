<script setup lang="ts">
const { t } = useI18n()
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

const emit = defineEmits<{ toggle: []; plain: [value: boolean] }>()

const who = computed(() => {
  if (props.line.actor === 'checks') return ''
  return props.line.self ? t('story.you') : props.line.actor
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
/** A comment folds only when its text runs past one line. */
const breaks = computed(() => /[\r\n]/.test(props.line.body ?? ''))
const overflows = ref(false)
const canFold = computed(
  () => Boolean(props.expandable) && long.value && (breaks.value || overflows.value),
)
const plainLine = computed(() => Boolean(props.expandable && props.line.body) && !canFold.value)

watch(plainLine, value => emit('plain', value), { immediate: true })
const probe = ref<HTMLElement | null>(null)
const box = ref<HTMLElement | null>(null)
const full = ref(0)
const shut = 34
let observer: ResizeObserver | null = null
let widthObserver: ResizeObserver | null = null

function measure(): void {
  const inner = box.value?.firstElementChild
  if (inner instanceof HTMLElement) full.value = inner.offsetHeight
}

/** One line that fits the column stays open in the comment box. Anything wider folds. */
function checkFold(): void {
  const el = probe.value
  if (!el) return
  overflows.value = el.scrollWidth > el.clientWidth + 1
}

watch(
  () => props.open,
  async value => {
    await nextTick()
    measure()
    const inner = box.value?.firstElementChild
    if (!(inner instanceof HTMLElement)) return
    if (value) {
      observer ??= new ResizeObserver(measure)
      observer.observe(inner)
    } else {
      observer?.disconnect()
      observer = null
    }
  },
)
watch(
  () => props.line.body,
  () =>
    nextTick(() => {
      measure()
      checkFold()
    }),
)
onMounted(() =>
  nextTick(() => {
    measure()
    checkFold()
    const el = probe.value
    if (!el) return
    widthObserver = new ResizeObserver(checkFold)
    widthObserver.observe(el)
  }),
)
onBeforeUnmount(() => {
  observer?.disconnect()
  widthObserver?.disconnect()
})
</script>

<template>
  <div
    class="st-text"
    :class="[
      `tone-${line.tone}`,
      line.mark ? `mark-${line.mark}` : '',
      { minor, reason: line.reason, rail: Boolean(rail) },
    ]"
    :style="rail ? { '--lane': String(rail.lane) } : undefined"
  >
    <div
      v-if="expandable && line.body && !breaks"
      class="st-measure"
    >
      <p
        ref="probe"
        class="st-probe"
        aria-hidden="true"
      >
        {{ line.body }}
      </p>
    </div>
    <span
      v-if="rail"
      class="st-rail-mark"
      aria-hidden="true"
    >
      <KindIcon :kind="rail.kind" />
    </span>
    <component
      :is="canFold ? 'button' : 'p'"
      v-if="rail"
      :type="canFold ? 'button' : undefined"
      class="st-head"
      :class="{ 'st-line-hit': canFold }"
      :aria-expanded="canFold ? open : undefined"
      @click="canFold && emit('toggle')"
    >
      <span class="st-rail-line">
        <SheetLink
          v-if="railPerson"
          :url="railPerson.href"
          :avatar="railPerson.avatar"
          @click.stop
        >
          {{ rail.who }}
        </SheetLink>
        <span
          v-else
          class="st-who"
          >{{ rail.who }}</span
        >
        <span>{{ t('story.openedItem') }}</span>
        <SheetLink
          :url="rail.url"
          :title="rail.title || undefined"
          @click.stop
          >#{{ rail.number }}</SheetLink
        >
      </span>
      <TimelineTime
        :at="new Date(line.at).toISOString()"
        :now-ms="nowMs"
        :url="line.url"
      />
    </component>
    <component
      :is="canFold ? 'button' : 'p'"
      v-else
      :type="canFold ? 'button' : undefined"
      class="st-head"
      :class="{ 'st-line-hit': canFold }"
      :aria-expanded="canFold ? open : undefined"
      @click="canFold && emit('toggle')"
    >
      <span class="st-title">
        <SheetLink
          v-if="linePerson"
          :url="linePerson.href"
          :avatar="linePerson.avatar"
          @click.stop
        >
          {{ who }}
        </SheetLink>
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
        <SheetLink
          v-if="line.ref"
          :url="line.ref.url"
          >#{{ line.ref.number }}</SheetLink
        >
        <span
          v-for="tag in line.tags"
          :key="tag"
          class="st-tag"
          :class="`t-${tag}`"
          >{{ t(`story.tag.${tag}`) }}</span
        >
      </span>
      <TimelineTime
        :at="new Date(line.at).toISOString()"
        :now-ms="nowMs"
        :url="line.url"
      />
    </component>
    <div
      v-if="canFold"
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
    <!-- One line still sits in the opened comment box. It just cannot fold. -->
    <div
      v-else-if="long"
      class="st-long is-plain"
    >
      <div class="st-long-in">
        <MarkdownBody
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
/* The probe needs a containing block of its own. Positioning .st-text would
   pull the issue and PR marks off the rail: they are offset from the row. */
.st-measure {
  position: relative;
  height: 0;
}

/* Same width as the comment box. If this line overflows, the comment folds. */
.st-probe {
  position: absolute;
  z-index: -1;
  width: 100%;
  height: 0;
  margin: 0;
  padding: 0 12px;
  overflow: hidden;
  box-sizing: border-box;
  font-size: 13.5px;
  line-height: 1.55;
  white-space: nowrap;
  visibility: hidden;
  pointer-events: none;
}

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

.st-who {
  line-height: 1.1;
}

.tone-bad .st-verb {
  color: var(--st-bad);
}

.tone-good .st-verb {
  color: var(--st-good);
}

.mark-bad .st-verb {
  color: var(--bad);
}

.mark-news .st-verb {
  color: var(--news);
}

.mark-run .st-verb {
  color: var(--run);
}

.mark-wait .st-verb {
  color: var(--warn);
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

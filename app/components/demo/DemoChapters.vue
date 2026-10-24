<script setup lang="ts">
import { ago, itemOf, type Story } from '~/demo/story'

const props = defineProps<{ story: Story; nowMs: number; wide?: boolean }>()

const toggled = ref(new Set<string>())

const chapters = computed(() => {
  const order: string[] = []
  for (const step of props.story.steps) if (!order.includes(step.item)) order.push(step.item)
  return order.map(key => {
    const steps = props.story.steps.filter(step => step.item === key)
    return { item: itemOf(props.story, key), steps, last: steps.at(-1)!.at }
  })
})

function isOpen(key: string): boolean {
  return toggled.value.has(key) !== (key === props.story.current)
}

function toggle(key: string): void {
  const next = new Set(toggled.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  toggled.value = next
}

function jump(key: string): void {
  if (!isOpen(key)) toggle(key)
}

watch(
  () => props.story.id,
  () => {
    toggled.value = new Set()
  },
)
</script>

<template>
  <div
    class="x-pane ch"
    :class="[`turn-${story.turn}`, { wide }]"
  >
    <DemoStoryHead
      :story="story"
      :now-ms="nowMs"
    />
    <div class="ch-layout">
      <aside class="ch-outline">
        <p class="x-label">Linked</p>
        <ul>
          <li
            v-for="chapter in chapters"
            :key="chapter.item.key"
          >
            <button
              type="button"
              :class="[
                `state-${chapter.item.state}`,
                { current: chapter.item.key === story.current },
              ]"
              @click="jump(chapter.item.key)"
            >
              <span class="ch-state" />
              <span class="ch-outline-ref">#{{ chapter.item.number }}</span>
              <span
                v-if="wide"
                class="ch-outline-rel"
                >{{ chapter.item.relation }}</span
              >
            </button>
          </li>
        </ul>
        <DemoRepoNotes
          v-if="wide"
          :story="story"
          :now-ms="nowMs"
        />
      </aside>

      <div class="ch-main">
        <section
          v-for="chapter in chapters"
          :key="chapter.item.key"
          class="ch-chapter"
          :class="[
            `state-${chapter.item.state}`,
            { open: isOpen(chapter.item.key), current: chapter.item.key === story.current },
          ]"
        >
          <button
            class="ch-head"
            type="button"
            :aria-expanded="isOpen(chapter.item.key)"
            @click="toggle(chapter.item.key)"
          >
            <span class="ch-kind"
              >{{ chapter.item.kind === 'pr' ? 'PR' : 'Issue' }} #{{ chapter.item.number }} ·
              {{ chapter.item.state }}</span
            >
            <span class="ch-title">{{ chapter.item.title }}</span>
            <span class="ch-rel">
              {{ chapter.item.relation }}
              <template v-if="!isOpen(chapter.item.key)">
                · {{ chapter.steps.length }} steps · {{ ago(chapter.last, nowMs) }}</template
              >
            </span>
          </button>
          <ol
            v-if="isOpen(chapter.item.key)"
            class="ch-steps"
          >
            <li
              v-for="step in chapter.steps"
              :key="step.id"
              :class="`k-${step.kind}`"
            >
              <p class="sp-line">
                <span
                  v-if="step.kind === 'note'"
                  class="sp-note-tag"
                  >Your note</span
                >
                <template v-else>
                  <b>{{ step.actor }}</b>
                  <span>{{ step.text }}</span>
                </template>
                <span class="sp-ago">{{ ago(step.at, nowMs) }}</span>
              </p>
              <p
                v-if="step.quote && (step.id === story.askId || step.kind === 'note')"
                class="sp-quote"
              >
                {{ step.quote }}
              </p>
              <p
                v-if="step.machineTone === 'bad'"
                class="sp-machine bad"
              >
                {{ step.machine }}
              </p>
              <p
                v-if="step.links?.length"
                class="sp-links"
              >
                <span
                  v-for="link in step.links"
                  :key="link.to"
                  >{{ link.label }} #{{ itemOf(story, link.to).number }}</span
                >
              </p>
            </li>
            <template v-if="chapter.item.key === story.current">
              <li
                class="ch-now"
                :class="`turn-${story.turn}`"
              >
                <p class="sp-now-label">Now</p>
                <p class="sp-now-line">{{ story.now }}</p>
              </li>
              <li
                v-for="(next, index) in story.next"
                :key="index"
                class="ch-next"
              >
                <p class="sp-line">
                  <b>{{ next.actor }}</b>
                  <span>{{ next.text }}</span>
                </p>
              </li>
            </template>
          </ol>
        </section>
        <DemoRepoNotes
          v-if="!wide"
          :story="story"
          :now-ms="nowMs"
        />
      </div>
    </div>
  </div>
</template>

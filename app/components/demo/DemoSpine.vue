<script setup lang="ts">
import { ago, itemOf, stepRef, type Step, type Story } from '~/demo/story'

const props = defineProps<{ story: Story; nowMs: number; wide?: boolean }>()

const opened = ref(new Set<string>())

function defaultOpen(step: Step): boolean {
  return step.id === props.story.askId || step.kind === 'note' || step.machineTone === 'bad'
}

function isOpen(step: Step): boolean {
  return opened.value.has(step.id) !== defaultOpen(step)
}

function expandable(step: Step): boolean {
  return Boolean(step.quote || step.machine)
}

function toggle(step: Step): void {
  const next = new Set(opened.value)
  if (next.has(step.id)) next.delete(step.id)
  else next.add(step.id)
  opened.value = next
}

watch(
  () => props.story.id,
  () => {
    opened.value = new Set()
  },
)
</script>

<template>
  <div
    class="x-pane sp"
    :class="[`turn-${story.turn}`, { wide }]"
  >
    <DemoStoryHead
      :story="story"
      :now-ms="nowMs"
    />
    <ul class="sp-linked">
      <li
        v-for="item in story.items"
        :key="item.key"
        :class="[`role-${item.role}`, `state-${item.state}`]"
      >
        <span class="sp-linked-ref">#{{ item.number }}</span>
        <span class="sp-linked-kind"
          >{{ item.kind === 'pr' ? 'PR' : 'issue' }} · {{ item.state }}</span
        >
        <span
          v-if="wide"
          class="sp-linked-rel"
          >{{ item.relation }}</span
        >
      </li>
    </ul>

    <ol class="sp-list">
      <li
        v-for="step in story.steps"
        :key="step.id"
        class="sp-step"
        :class="[`k-${step.kind}`, { ask: step.id === story.askId, open: isOpen(step) }]"
      >
        <span
          class="sp-node"
          aria-hidden="true"
        />
        <component
          :is="expandable(step) ? 'button' : 'div'"
          class="sp-line"
          :type="expandable(step) ? 'button' : undefined"
          :aria-expanded="expandable(step) ? isOpen(step) : undefined"
          @click="expandable(step) && toggle(step)"
        >
          <span
            v-if="step.kind === 'note'"
            class="sp-note-tag"
            >Your note</span
          >
          <template v-else>
            <b>{{ step.actor }}</b>
            <span>{{ step.text }}</span>
          </template>
          <span
            v-if="stepRef(story, step)"
            class="sp-ref"
            >{{ stepRef(story, step) }}</span
          >
          <span class="sp-ago">{{ ago(step.at, nowMs) }}</span>
        </component>
        <p
          v-if="isOpen(step) && step.quote"
          class="sp-quote"
        >
          {{ step.quote }}
        </p>
        <p
          v-if="isOpen(step) && step.machine"
          class="sp-machine"
          :class="step.machineTone"
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
      <li
        class="sp-step sp-now"
        :class="`turn-${story.turn}`"
      >
        <span
          class="sp-node"
          aria-hidden="true"
        />
        <p class="sp-now-label">Now</p>
        <p class="sp-now-line">{{ story.now }}</p>
      </li>
      <li
        v-for="(next, index) in story.next"
        :key="index"
        class="sp-step sp-next"
      >
        <span
          class="sp-node"
          aria-hidden="true"
        />
        <p class="sp-line">
          <b>{{ next.actor }}</b>
          <span>{{ next.text }}</span>
        </p>
      </li>
    </ol>

    <DemoRepoNotes
      :story="story"
      :now-ms="nowMs"
    />
  </div>
</template>

<script setup lang="ts">
import { copy } from '~/copy/en'
import { relationOf, type Story } from '~/utils/story'

const props = defineProps<{ story: Story; viewer: string }>()
const focus = defineModel<number | null>('focus', { default: null })

const entries = computed(() =>
  props.story.lanes.flatMap((lane, index) => lane.map(item => ({ item, index }))),
)
</script>

<template>
  <ul class="st-legend">
    <li
      v-for="entry in entries"
      :key="entry.item.key"
      class="st-legend-row"
      :class="{ dim: focus !== null && focus !== entry.index }"
      @pointerenter="focus = entry.index"
      @pointerleave="focus = null"
    >
      <span
        class="st-gutter"
        aria-hidden="true"
      >
        <span
          v-for="(_, l) in story.lanes"
          :key="l"
          class="st-cell"
          :class="{
            other: entry.item.authorLogin.toLowerCase() !== viewer.toLowerCase(),
            primary: entry.item.role === 'primary',
          }"
        >
          <i
            v-if="l === entry.index"
            class="st-node"
            :class="`n-${entry.item.state === 'open' ? 'open' : entry.item.state}`"
          />
        </span>
      </span>
      <a
        class="st-legend-text"
        :href="entry.item.url"
        :title="entry.item.title || undefined"
        target="_blank"
        rel="noreferrer"
        @focus="focus = entry.index"
        @blur="focus = null"
      >
        <b>#{{ entry.item.number }}</b>
        <span class="st-legend-kind">{{ copy.story.kind[entry.item.kind] }}</span>
        <span
          class="st-legend-state"
          :class="`s-${entry.item.state}`"
          >{{ copy.story.state[entry.item.state] }}</span
        >
        <span class="st-legend-rel">{{ relationOf(entry.item, story, viewer) }}</span>
      </a>
    </li>
  </ul>
</template>

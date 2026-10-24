<script setup lang="ts">
import type { StoryCell } from '~/utils/story'

defineProps<{ cells: StoryCell[]; focus: number | null }>()
</script>

<template>
  <span
    class="st-gutter"
    aria-hidden="true"
  >
    <span
      v-for="cell in cells"
      :key="cell.lane"
      class="st-cell"
      :class="{
        other: !cell.mine,
        primary: cell.primary,
        dashed: cell.dashed,
        fade: cell.fade,
        dim: focus !== null && focus !== cell.lane,
      }"
    >
      <i
        v-if="cell.up"
        class="st-up"
      />
      <i
        v-if="cell.down"
        class="st-down"
      />
      <i
        v-if="cell.hl"
        class="st-h st-hl"
        :class="[`to-${cell.link}`, { cross: cell.cross }]"
      />
      <i
        v-if="cell.hr"
        class="st-h st-hr"
        :class="[`to-${cell.link}`, { cross: cell.cross }]"
      />
      <i
        v-if="cell.node"
        class="st-node"
        :class="`n-${cell.node}`"
      >
        <template v-if="cell.node === 'stack' || cell.node === 'group'"><b /><b /><b /></template>
      </i>
    </span>
  </span>
</template>

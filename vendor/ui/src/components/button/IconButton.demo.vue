<script setup lang="ts">
import BellBold from '@iconify-vue/solar/bell-bold'
import BellLinear from '@iconify-vue/solar/bell-linear'
import BellOffLinear from '@iconify-vue/solar/bell-off-linear'
import BookmarkBold from '@iconify-vue/solar/bookmark-bold'
import BookmarkLinear from '@iconify-vue/solar/bookmark-linear'
import CloseLinear from '@iconify-vue/solar/close-linear'
import StarOutline from '@iconify-vue/solar/star-outline'
import TrashBinMinimalisticBold from '@iconify-vue/solar/trash-bin-minimalistic-bold'
import TrashBinMinimalisticLinear from '@iconify-vue/solar/trash-bin-minimalistic-linear'
import VolumeBold from '@iconify-vue/solar/volume-bold'
import VolumeCrossLinear from '@iconify-vue/solar/volume-cross-linear'
import { ref } from 'vue'
import IconButton from './IconButton.vue'

const last = ref('')

async function save(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 900))
  last.value = 'saved'
}

async function fail(): Promise<void> {
  await new Promise((_, reject) => setTimeout(reject, 900))
  last.value = 'failed'
}
</script>

<template>
  <div class="demo-rows">
    <div class="demo-row">
      <div class="demo-sentence">
        <IconButton
          label="Save"
          :action="save"
        >
          <template #icon>
            <BookmarkLinear />
          </template>
          <template #iconActive>
            <BookmarkBold />
          </template>
        </IconButton>
        <IconButton
          label="Delete"
          :action="fail"
        >
          <template #icon>
            <TrashBinMinimalisticLinear />
          </template>
          <template #iconError>
            <CloseLinear />
          </template>
        </IconButton>
      </div>
      <div class="demo-value">
        <code>action</code>
        <span>pending pulses · {{ last }}</span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <IconButton
          label="Bell"
          :action="save"
        >
          <template #icon>
            <BellLinear />
          </template>
          <template #iconActive>
            <BellBold />
          </template>
        </IconButton>
        <IconButton
          label="Sound"
          :action="save"
        >
          <template #icon>
            <VolumeBold />
          </template>
          <template #iconActive>
            <VolumeCrossLinear />
          </template>
        </IconButton>
      </div>
      <div class="demo-value">
        <code>icon / iconActive</code>
        <span>linear → bold on success</span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <IconButton
          label="Mute"
          :frame="false"
          :action="save"
        >
          <template #icon>
            <BellOffLinear />
          </template>
        </IconButton>
        <IconButton
          label="Star"
          :frame="false"
          :action="fail"
        >
          <template #icon>
            <StarOutline />
          </template>
        </IconButton>
      </div>
      <div class="demo-value">
        <code>frame=false</code>
        <span>bare glyphs</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-rows {
  display: grid;
  gap: 20px;
}

.demo-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 20px;
  align-items: start;
}

.demo-sentence {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.demo-value {
  display: grid;
  gap: 4px;
  justify-items: start;
  padding-top: 3px;
  color: var(--ui-muted);
  font-size: 11px;
}

.demo-value code {
  color: var(--ui-fg);
  font-family: var(--ui-font-meta);
}

.demo-value span {
  font-family: var(--ui-font-meta);
}
</style>

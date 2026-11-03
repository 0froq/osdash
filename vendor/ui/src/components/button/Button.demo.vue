<script setup lang="ts">
import DocumentTextLinear from '@iconify-vue/solar/document-text-linear'
import FileBold from '@iconify-vue/solar/file-bold'
import AddBold from '@iconify-vue/solar/add-bold'
import TrashBinMinimalisticLinear from '@iconify-vue/solar/trash-bin-minimalistic-linear'
import { ref } from 'vue'
import WordSwap from '../toggle/WordSwap.vue'
import Button from './Button.vue'

const saved = ref(false)
const last = ref('')

async function save(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 900))
  saved.value = true
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
        <Button @click="saved = true"> Plain click </Button>
        <Button :action="save"> Save (succeeds) </Button>
        <Button :action="fail"> Save (fails) </Button>
      </div>
      <div class="demo-value">
        <code>action</code>
        <span
          >pending pulses ·
          <WordSwap
            :on="!!last"
            :off-label="'—'"
            :on-label="last"
        /></span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <Button :action="save">
          <AddBold
            width="1em"
            height="1em"
          />
          New
        </Button>
        <Button :action="save">
          <DocumentTextLinear
            width="1em"
            height="1em"
          />
          Notes
        </Button>
      </div>
      <div class="demo-value">
        <code>icon + action</code>
        <span
          >solar icons · last=<WordSwap
            :on="!!last"
            :off-label="'—'"
            :on-label="last"
        /></span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <Button :action="fail">
          <TrashBinMinimalisticLinear
            width="1em"
            height="1em"
          />
          Delete
        </Button>
        <Button :action="save">
          <FileBold
            width="1em"
            height="1em"
          />
          Save copy
        </Button>
      </div>
      <div class="demo-value">
        <code>icon + action</code>
        <span
          >fail shakes, save sweeps · last=<WordSwap
            :on="!!last"
            :off-label="'—'"
            :on-label="last"
        /></span>
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
  gap: 16px;
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

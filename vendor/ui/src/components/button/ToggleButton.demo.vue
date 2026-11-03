<script setup lang="ts">
import BellBold from '@iconify-vue/solar/bell-bold'
import BellOutline from '@iconify-vue/solar/bell-outline'
import VolumeBold from '@iconify-vue/solar/volume-bold'
import VolumeCrossLinear from '@iconify-vue/solar/volume-cross-linear'
import { ref } from 'vue'
import WordSwap from '../toggle/WordSwap.vue'
import ToggleButton from './ToggleButton.vue'

const bold = ref(true)
const notify = ref(false)
const mute = ref(false)
const seq = ref(false)
const autoSeq = ref(false)
const icons = ref(false)
</script>

<template>
  <div class="demo-rows">
    <div class="demo-row">
      <div class="demo-sentence">
        <ToggleButton v-model="bold">
          <strong>B</strong>
        </ToggleButton>
      </div>
      <div class="demo-value">
        <code>default slot</code>
        <span
          >static · bold=<WordSwap
            :on="bold"
            off-label="false"
            on-label="true"
        /></span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <ToggleButton
          v-model="notify"
          off-text="Notify off"
          on-text="Notify on"
        />
      </div>
      <div class="demo-value">
        <code>offText / onText</code>
        <span
          >shared "Notify " · notify=<WordSwap
            :on="notify"
            off-label="false"
            on-label="true"
        /></span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <ToggleButton
          v-model="mute"
          off-text="Mute"
          on-text="Unmute"
        />
      </div>
      <div class="demo-value">
        <code>offText / onText</code>
        <span
          >shared "ute" · mute=<WordSwap
            :on="mute"
            off-label="false"
            on-label="true"
        /></span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <ToggleButton
          v-model="autoSeq"
          off-text="AXCYE"
          on-text="ABCDE"
        />
      </div>
      <div class="demo-value">
        <code>offText / onText</code>
        <span
          >keeps A·E, rolls XCY→BCD · autoSeq=<WordSwap
            :on="autoSeq"
            off-label="false"
            on-label="true"
        /></span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <ToggleButton v-model="seq">
          A<WordSwap
            :on="seq"
            off-label="X"
            on-label="B"
          />C<WordSwap
            :on="seq"
            off-label="Y"
            on-label="D"
          />E
        </ToggleButton>
      </div>
      <div class="demo-value">
        <code>slot + WordSwap</code>
        <span
          >two cells roll · seq=<WordSwap
            :on="seq"
            off-label="false"
            on-label="true"
        /></span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <ToggleButton v-model="icons">
          Sound
          <WordSwap :on="icons">
            <template #off>
              <VolumeBold
                width="1em"
                height="1em"
              />
            </template>
            <template #on>
              <VolumeCrossLinear
                width="1em"
                height="1em"
              />
            </template>
          </WordSwap>
        </ToggleButton>
        <ToggleButton v-model="icons">
          Alert
          <WordSwap :on="icons">
            <template #off>
              <BellOutline
                width="1em"
                height="1em"
              />
            </template>
            <template #on>
              <BellBold
                width="1em"
                height="1em"
              />
            </template>
          </WordSwap>
        </ToggleButton>
      </div>
      <div class="demo-value">
        <code>WordSwap content</code>
        <span
          >icons or anything · icons=<WordSwap
            :on="icons"
            off-label="false"
            on-label="true"
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

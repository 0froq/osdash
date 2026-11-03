<script setup lang="ts">
import BellBold from '@iconify-vue/solar/bell-bold'
import BellOutline from '@iconify-vue/solar/bell-outline'
import LockKeyholeBold from '@iconify-vue/solar/lock-keyhole-bold'
import LockKeyholeUnlockedOutline from '@iconify-vue/solar/lock-keyhole-unlocked-outline'
import StarBold from '@iconify-vue/solar/star-bold'
import StarOutline from '@iconify-vue/solar/star-outline'
import { ref } from 'vue'
import WordSwap from '../toggle/WordSwap.vue'
import ToggleIconButton from './ToggleIconButton.vue'

const star = ref(false)
const bell = ref(true)
const lock = ref(false)
</script>

<template>
  <div class="demo-rows">
    <div class="demo-row">
      <div class="demo-sentence">
        <ToggleIconButton
          v-model="star"
          label="Star"
        >
          <template #icon>
            <StarOutline />
          </template>
          <template #iconOn>
            <StarBold />
          </template>
        </ToggleIconButton>
      </div>
      <div class="demo-value">
        <code>icon / iconOn</code>
        <span
          >outline → filled · star=<WordSwap
            :on="star"
            off-label="false"
            on-label="true"
        /></span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <ToggleIconButton
          v-model="bell"
          label="Notifications"
        >
          <template #icon>
            <BellOutline />
          </template>
          <template #iconOn>
            <BellBold />
          </template>
        </ToggleIconButton>
      </div>
      <div class="demo-value">
        <code>icon / iconOn</code>
        <span
          >linear → bold · bell=<WordSwap
            :on="bell"
            off-label="false"
            on-label="true"
        /></span>
      </div>
    </div>
    <div class="demo-row">
      <div class="demo-sentence">
        <ToggleIconButton
          v-model="lock"
          :frame="false"
          label="Lock"
        >
          <template #icon>
            <LockKeyholeUnlockedOutline />
          </template>
          <template #iconOn>
            <LockKeyholeBold />
          </template>
        </ToggleIconButton>
      </div>
      <div class="demo-value">
        <code>frame=false</code>
        <span
          >bare, unlocked → locked · lock=<WordSwap
            :on="lock"
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

<script setup lang="ts">
import type { UnitView } from '#shared/unit'
import { copy } from '~/copy/zh-CN'
import { stateLabel } from '~/utils/category'
import { reasonText } from '~/utils/reason'
import { relativeAge } from '~/utils/time'

const props = defineProps<{ unit: UnitView }>()

const emit = defineEmits<{
  star: []
  later: [preset: string | null]
}>()

const laterOpen = ref(false)
const reason = computed(() =>
  props.unit.reasonCode === 'clef' && props.unit.quote
    ? props.unit.quote
    : reasonText(props.unit.reasonCode, props.unit.reasonActor),
)
const opened = computed(() => relativeAge(Date.now() - Date.parse(props.unit.createdAt)))
</script>

<template>
  <header class="preview-head">
    <p class="preview-kicker">
      {{ unit.repo }}#{{ unit.number }}
      ·
      {{ copy.openedFor(opened) }}
    </p>
    <h2>{{ unit.title }}</h2>
    <p class="preview-state">{{ stateLabel(unit.state) }}</p>
    <ul
      v-if="unit.issues.length"
      class="preview-issues"
    >
      <li
        v-for="issue in unit.issues"
        :key="issue.url"
      >
        <a
          :href="issue.url"
          target="_blank"
          rel="noreferrer"
          >#{{ issue.number }} {{ issue.title }}</a
        >
        · {{ stateLabel(issue.state) }}
        ·
        <a
          class="card-link"
          :href="issue.url"
          target="_blank"
          rel="noreferrer"
          >{{ copy.preview.source }}</a
        >
        <span
          v-for="share in issue.sharedWith"
          :key="share.url"
        >
          {{ copy.sharedWith(share.number) }}
        </span>
      </li>
    </ul>
    <p v-if="unit.fixedBy">
      <a
        class="card-link"
        :href="unit.fixedBy.url"
        target="_blank"
        rel="noreferrer"
        >{{ copy.fixedBy(unit.fixedBy.authorLogin, unit.fixedBy.number) }}</a
      >
    </p>
    <details v-if="unit.history.length">
      <summary>{{ copy.preview.historySummary }}</summary>
      <p
        v-for="pr in unit.history"
        :key="pr.url"
      >
        <a
          :href="pr.url"
          target="_blank"
          rel="noreferrer"
          >{{ copy.historyPr(pr.number) }}</a
        >
      </p>
    </details>
    <p class="card-reason">{{ reason }}</p>
    <div class="preview-actions">
      <button
        type="button"
        @click="laterOpen = !laterOpen"
        >{{ copy.menu.later }}</button
      >
      <button
        type="button"
        @click="emit('star')"
        >{{ unit.starred ? copy.menu.unstar : copy.menu.star }}</button
      >
      <a
        class="card-link"
        :href="unit.url"
        target="_blank"
        rel="noreferrer"
        >{{ copy.preview.openGithub }}</a
      >
    </div>
    <div
      v-if="laterOpen"
      class="preview-later"
    >
      <button
        type="button"
        @click="emit('later', 'tomorrow')"
        >{{ copy.laterPresets.tomorrow }}</button
      >
      <button
        type="button"
        @click="emit('later', 'three-days')"
        >{{ copy.laterPresets.threeDays }}</button
      >
      <button
        type="button"
        @click="emit('later', 'monday')"
        >{{ copy.laterPresets.nextMonday }}</button
      >
      <button
        v-if="unit.laterUntil"
        type="button"
        @click="emit('later', null)"
        >{{ copy.menu.clearLater }}</button
      >
    </div>
  </header>
</template>

<script setup lang="ts">
import type { TagItem } from '@froq/ui'
import type { UnitView } from '#shared/unit'
import { Tags } from '@froq/ui'
import { boardLabel, markLabel, tagLabel } from '~/utils/category'
import { untilTime } from '~/utils/time'

const { t } = useI18n()

const props = defineProps<{
  unit: UnitView
  /** Timestamp this unit is snoozed until. Omit where the snooze already shows. */
  laterAt?: number
}>()

const SAID = "said I'd do it but haven't"

/**
 * Claim, "said I'd do it" and "self-claimed" all say the same thing: you took
 * it. They show as one tag, whether you claimed or were assigned.
 */
const claimed = computed(
  () =>
    props.unit.tags.includes('claim') ||
    props.unit.marks.includes(SAID) ||
    props.unit.labels.includes('Self-claimed'),
)

/**
 * What the library draws is generic. What a unit says about itself stays here:
 * the wording, which facts merge, and which of them ask for a look. `help` stays
 * in the data, because it decides which issues reach the board, but it is not
 * shown: the keyword match is too unreliable to read as a fact.
 */
const items = computed<TagItem[]>(() => {
  const { unit, laterAt } = props
  const list: TagItem[] = []
  if (unit.kind === 'issue-only' && !unit.fixedBy) list.push({ value: 'no-pr', label: t('noPr') })
  if (laterAt)
    list.push({
      value: 'later',
      label: t('laterUntil', { when: untilTime(laterAt) }),
      pending: true,
    })
  if (claimed.value) list.push({ value: 'claimed', label: tagLabel(t, 'claim') })
  for (const tag of unit.tags)
    if (tag !== 'claim' && tag !== 'help')
      list.push({ value: `tag:${tag}`, label: tagLabel(t, tag) })
  for (const mark of unit.marks)
    if (mark !== SAID)
      list.push({ value: `mark:${mark}`, label: markLabel(t, mark), tone: 'accent' })
  for (const label of unit.labels)
    if (label !== 'Self-claimed')
      list.push({ value: `label:${label}`, label: boardLabel(t, label), tone: 'accent' })
  if (unit.fixedBy)
    list.push({
      value: 'fixed-by',
      label: t('fixedBy', { login: unit.fixedBy.authorLogin, number: unit.fixedBy.number }),
      href: unit.fixedBy.url,
      external: true,
    })
  for (const issue of unit.issues)
    list.push({ value: `issue:${issue.url}`, label: t('related', { number: issue.number }) })
  return list
})

/** The tags sit inside a card that selects on click; a link must not select it. */
function stop(_item: TagItem, event: MouseEvent): void {
  event.stopPropagation()
}
</script>

<template>
  <Tags
    :items="items"
    :label="t('tagsLabel')"
    @activate="stop"
  />
</template>

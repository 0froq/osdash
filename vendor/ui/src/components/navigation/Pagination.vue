<script setup lang="ts">
import type { PaginationControlProps } from '../../vue'
import { computed } from 'vue'
import { currentPage, pageCount, paginationEntries } from '../../core'

const props = withDefaults(defineProps<{
  label: string
  pages: number
  previousLabel: string
  nextLabel: string
  pageLabel: (page: number) => string
  siblingCount?: number
  disabled?: boolean
  href?: (page: number) => string
}>(), { siblingCount: 1, disabled: false })
defineSlots<{
  control?: (scope: { page: number, kind: 'page' | 'previous' | 'next', tag: 'a' | 'button', props: PaginationControlProps }) => unknown
}>()
const model = defineModel<number>({ default: 1 })
const count = computed(() => pageCount(props.pages))
const current = computed(() => currentPage(model.value, count.value))
const entries = computed(() => paginationEntries(current.value, count.value, props.siblingCount))
const previous = computed(() => Math.max(1, current.value - 1))
const next = computed(() => Math.min(Math.max(1, count.value), current.value + 1))

function disabled(page: number, kind: 'page' | 'previous' | 'next'): boolean {
  return props.disabled || !count.value || (kind !== 'page' && page === current.value)
}
function tag(page: number, kind: 'page' | 'previous' | 'next'): 'a' | 'button' {
  return props.href && !disabled(page, kind) ? 'a' : 'button'
}
function controlProps(page: number, kind: 'page' | 'previous' | 'next'): PaginationControlProps {
  const blocked = disabled(page, kind)
  const isLink = tag(page, kind) === 'a'
  return {
    'class': 'ui-pagination-control',
    'type': isLink ? undefined : 'button',
    'href': isLink ? props.href?.(page) : undefined,
    'disabled': blocked || undefined,
    'aria-disabled': blocked || undefined,
    'aria-label': kind === 'previous' ? props.previousLabel : kind === 'next' ? props.nextLabel : props.pageLabel(page),
    'aria-current': kind === 'page' && page === current.value ? 'page' : undefined,
    'onClick': (event) => {
      if (blocked) {
        event.preventDefault()
        return
      }
      if (event.defaultPrevented || (isLink && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)))
        return
      model.value = page
    },
  }
}
</script>

<template>
  <nav
    class="ui-pagination"
    :aria-label="label"
  >
    <ul
      class="ui-pagination-list"
      role="list"
    >
      <li>
        <slot
          name="control"
          :page="previous"
          kind="previous"
          :tag="tag(previous, 'previous')"
          :props="controlProps(previous, 'previous')"
        >
          <component
            :is="tag(previous, 'previous')"
            v-bind="controlProps(previous, 'previous')"
          >
            {{ previousLabel }}
          </component>
        </slot>
      </li>
      <li
        v-for="entry in entries"
        :key="entry"
      >
        <span
          v-if="typeof entry !== 'number'"
          class="ui-pagination-gap"
          aria-hidden="true"
        >…</span>
        <slot
          v-else
          name="control"
          :page="entry"
          kind="page"
          :tag="tag(entry, 'page')"
          :props="controlProps(entry, 'page')"
        >
          <component
            :is="tag(entry, 'page')"
            v-bind="controlProps(entry, 'page')"
          >
            {{ entry }}
          </component>
        </slot>
      </li>
      <li>
        <slot
          name="control"
          :page="next"
          kind="next"
          :tag="tag(next, 'next')"
          :props="controlProps(next, 'next')"
        >
          <component
            :is="tag(next, 'next')"
            v-bind="controlProps(next, 'next')"
          >
            {{ nextLabel }}
          </component>
        </slot>
      </li>
    </ul>
  </nav>
</template>

import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ChoiceOption } from './types'
import { computed, toValue } from 'vue'
import { targetIndex } from '../core'

/**
 * The behavior of a single-choice radio group, with no opinion about how it looks.
 * `active` is the ref the group reads its selected state from.
 */
export function useChoice<T extends string>(options: MaybeRefOrGetter<readonly ChoiceOption<T>[]>, active: Ref<T>, disabled: MaybeRefOrGetter<boolean> = false) {
  const values = computed(() => toValue(options).map(option => option.value))
  // Callers often pass a fresh array literal on every render, so watch content, not identity.
  const signature = computed(() => toValue(options).map(option => `${option.value}\u0000${option.label}\u0000${Boolean(option.disabled)}`).join('\u0001'))
  const available = computed(() => toValue(options).filter(option => !option.disabled).map(option => option.value))

  function isActive(value: T): boolean {
    return active.value === value
  }

  function tabindex(value: T): 0 | -1 {
    if (isDisabled(value))
      return -1
    const target = available.value.includes(active.value) ? active.value : available.value[0]
    return target === value ? 0 : -1
  }

  function isDisabled(value: T): boolean {
    return toValue(disabled) || !toValue(options).some(option => option.value === value && !option.disabled)
  }

  function onKeydown(event: KeyboardEvent, choose: (value: T) => void, focused: T = active.value): void {
    if (event.defaultPrevented || toValue(disabled) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return
    const index = targetIndex(event.key, available.value.indexOf(focused), available.value.length)
    const next = index === undefined ? undefined : available.value[index]
    if (index === undefined || next === undefined)
      return
    event.preventDefault()
    choose(next)
    const group = (event.currentTarget as HTMLElement).closest('[role="radiogroup"]')
    group?.querySelectorAll<HTMLElement>('[role="radio"]:not(:disabled):not([aria-disabled="true"])')[index]?.focus()
  }

  return { values, signature, isActive, isDisabled, tabindex, onKeydown }
}

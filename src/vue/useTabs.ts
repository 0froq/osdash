import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ChoiceOption } from './types'
import { computed, toValue } from 'vue'
import { targetIndex } from '../core'

export function useTabs<T extends string>(
  options: MaybeRefOrGetter<ChoiceOption<T>[]>,
  active: Ref<T>,
  orientation: MaybeRefOrGetter<'horizontal' | 'vertical'> = 'horizontal',
  activation: MaybeRefOrGetter<'automatic' | 'manual'> = 'automatic',
) {
  const enabled = computed(() => toValue(options).filter(item => !item.disabled))
  function tabindex(value: T) {
    const target = enabled.value.find(item => item.value === active.value) ?? enabled.value[0]
    return target?.value === value ? 0 : -1
  }
  function select(value: T) {
    if (enabled.value.some(item => item.value === value))
      active.value = value
  }
  function onKeydown(event: KeyboardEvent, value: T) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return
    const vertical = toValue(orientation) === 'vertical'
    if ((vertical && (event.key === 'ArrowLeft' || event.key === 'ArrowRight'))
      || (!vertical && (event.key === 'ArrowUp' || event.key === 'ArrowDown'))) {
      return
    }
    let key = event.key
    if (!vertical && event.currentTarget instanceof HTMLElement && getComputedStyle(event.currentTarget).direction === 'rtl') {
      if (key === 'ArrowLeft')
        key = 'ArrowRight'
      else if (key === 'ArrowRight')
        key = 'ArrowLeft'
    }
    const index = targetIndex(key, enabled.value.findIndex(item => item.value === value), enabled.value.length)
    const next = index === undefined ? undefined : enabled.value[index]
    if (!next)
      return
    event.preventDefault()
    const list = (event.currentTarget as HTMLElement | null)?.closest('[role="tablist"]')
    list?.querySelectorAll<HTMLElement>('[role="tab"]:not(:disabled)')[index!]?.focus()
    if (toValue(activation) === 'automatic')
      select(next.value)
  }
  return { tabindex, select, onKeydown }
}

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createPaperPaint } from '../../core/paper'

const props = withDefaults(defineProps<{
  /** Fibre while the page is light. */
  light?: boolean
  /** Specks while the page is dark. */
  dark?: boolean
}>(), {
  light: true,
  dark: true,
})

const root = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const paint = createPaperPaint()
let frame = 0
let observed: MutationObserver | undefined
let resized: ResizeObserver | undefined

function darkNow(): boolean {
  const el = document.documentElement
  if (el.dataset.theme === 'dark' || el.dataset.theme === 'light')
    return el.dataset.theme === 'dark'
  return el.classList.contains('dark')
}

function mode(): 'light' | 'dark' | 'off' {
  if (darkNow())
    return props.dark ? 'dark' : 'off'
  return props.light ? 'light' : 'off'
}

function readPaper(el: HTMLElement): [number, number, number] {
  const bits = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)
  if (!bits || bits.length < 3)
    return [244, 242, 236]
  return [Number(bits[0]), Number(bits[1]), Number(bits[2])]
}

function draw(): void {
  const el = root.value
  const node = canvas.value
  if (!el || !node)
    return
  const rect = el.getBoundingClientRect()
  const left = Math.max(rect.left, 0)
  const top = Math.max(rect.top, 0)
  const right = Math.min(rect.right, window.innerWidth)
  const bottom = Math.min(rect.bottom, window.innerHeight)
  const width = right - left
  const height = bottom - top
  if (width <= 1 || height <= 1) {
    node.width = 0
    node.height = 0
    return
  }
  node.style.left = `${left - rect.left}px`
  node.style.top = `${top - rect.top}px`
  node.style.width = `${width}px`
  node.style.height = `${height}px`
  paint.draw(node, {
    width,
    height,
    docX: left + window.scrollX,
    docY: top + window.scrollY,
    paper: readPaper(el),
    mode: mode(),
  })
}

function schedule(): void {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(draw)
}

onMounted(() => {
  schedule()
  resized = new ResizeObserver(schedule)
  if (root.value)
    resized.observe(root.value)
  observed = new MutationObserver(schedule)
  observed.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
  window.addEventListener('resize', schedule)
  window.addEventListener('scroll', schedule, { passive: true })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resized?.disconnect()
  observed?.disconnect()
  window.removeEventListener('resize', schedule)
  window.removeEventListener('scroll', schedule)
  paint.destroy()
})

watch(() => [props.light, props.dark], schedule)
</script>

<template>
  <div
    ref="root"
    class="ui-paper"
  >
    <canvas
      ref="canvas"
      class="ui-paper-grain"
      aria-hidden="true"
    />
    <div class="ui-paper-body">
      <slot />
    </div>
  </div>
</template>

import { formatDuration } from '#shared/turn'
import { copy } from '~/copy/zh-CN'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Relative time from an age in milliseconds, via Intl. */
export function relativeAge(ageMs: number): string {
  if (ageMs < MINUTE) return copy.justNow
  const format = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'always' })
  if (ageMs < HOUR) return format.format(-Math.floor(ageMs / MINUTE), 'minute')
  if (ageMs < DAY) return format.format(-Math.floor(ageMs / HOUR), 'hour')
  return format.format(-Math.floor(ageMs / DAY), 'day')
}

/** Day count for a waiting card. Under a day, fall back to the relative phrase. */
export function waitingAge(ageMs: number): string {
  if (ageMs < DAY) return relativeAge(ageMs)
  return copy.days(Math.floor(ageMs / DAY))
}

export function absoluteTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

export function absoluteDay(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

/** Compact duration used in the stats line, matching the plan's `1d 3h` example. */
export function replyDuration(ms: number | null): string {
  if (ms === null) return copy.none
  return formatDuration(ms)
}

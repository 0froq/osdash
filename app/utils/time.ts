import { formatDuration } from '#shared/turn'
import type { TFunc } from '#shared/i18n'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Relative time from an age in milliseconds, via Intl. */
export function relativeAge(t: TFunc, ageMs: number): string {
  if (ageMs < MINUTE) return t('justNow')
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'always' })
  if (ageMs < HOUR) return format.format(-Math.floor(ageMs / MINUTE), 'minute')
  if (ageMs < DAY) return format.format(-Math.floor(ageMs / HOUR), 'hour')
  return format.format(-Math.floor(ageMs / DAY), 'day')
}

/** Day count for a waiting card. Under a day, fall back to the relative phrase. */
export function waitingAge(t: TFunc, ageMs: number): string {
  if (ageMs < DAY) return relativeAge(t, ageMs)
  const count = Math.floor(ageMs / DAY)
  return t('days', { count }, count)
}

export function absoluteTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const day = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' }).format(date)
  const clock = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  return `${day} ${clock}`
}

export function absoluteDay(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const day = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' }).format(date)
  const weekday = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date)
  return `${day} ${weekday}`
}

/** `Tue, Oct 20`. */
export function dayLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/** `14:32`. */
export function clockTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

/** `14:32` today or tomorrow, `Tue, Nov 4` past that. */
export function untilTime(at: number): string {
  const iso = new Date(at).toISOString()
  const diff = at - Date.now()
  return diff < 2 * DAY ? clockTime(iso) : dayLabel(iso)
}

/** `now`, `12m`, `5h`, `3d`, `Oct 2`. Short enough for a phone row. */
export function shortAge(t: TFunc, iso: string, nowMs: number): string {
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return ''
  const age = Math.max(0, nowMs - at)
  if (age < MINUTE) return t('story.justNow')
  if (age < HOUR) return `${Math.floor(age / MINUTE)}m`
  if (age < DAY) return `${Math.floor(age / HOUR)}h`
  if (age < 30 * DAY) return `${Math.floor(age / DAY)}d`
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(at)
}

/** Compact duration used in the stats line, matching the plan's `1d 3h` example. */
export function replyDuration(t: TFunc, ms: number | null): string {
  if (ms === null) return t('none')
  return formatDuration(ms)
}

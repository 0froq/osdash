import { parseDate } from '@internationalized/date'

/** Gregorian date-only value. Empty means unset; invalid nonempty input fails explicitly. */
export function parseCalendarDate(value: string) {
  if (!value)
    return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-'))
    throw new RangeError(`Expected a Gregorian YYYY-MM-DD date: ${value}`)
  return parseDate(value)
}

export function calendarDateBounds(min?: string, max?: string) {
  const lower = min === undefined ? undefined : parseCalendarDate(min)
  const upper = max === undefined ? undefined : parseCalendarDate(max)
  if (lower && upper && lower.compare(upper) > 0)
    throw new RangeError('Calendar minimum must not be after maximum')
  return { min: lower, max: upper }
}

/** Format a date-only value without interpreting it in the consumer's local time zone. */
export function formatCalendarDate(value: string, locale: string) {
  const date = parseCalendarDate(value)
  return date
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date.toDate('UTC'))
    : ''
}

const DAY = 24 * 60 * 60 * 1000

export function tomorrowMorning(now = new Date()): string {
  const next = new Date(now)
  next.setDate(next.getDate() + 1)
  next.setHours(8, 0, 0, 0)
  return next.toISOString()
}

export function threeDaysLater(now = new Date()): string {
  return new Date(now.getTime() + 3 * DAY).toISOString()
}

/** Next Monday at 08:00 in the local timezone. */
export function nextMondayMorning(now = new Date()): string {
  const next = new Date(now)
  const day = next.getDay()
  const add = (8 - day) % 7 || 7
  next.setDate(next.getDate() + add)
  next.setHours(8, 0, 0, 0)
  return next.toISOString()
}

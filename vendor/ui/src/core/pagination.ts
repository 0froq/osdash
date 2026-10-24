export type PaginationEntry = number | 'start-gap' | 'end-gap'

export function pageCount(pages: number): number {
  return Number.isFinite(pages) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(pages))) : 0
}

export function currentPage(page: number, pages: number): number {
  return Math.min(Math.max(1, pageCount(pages)), Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1))
}

/** Build only the requested window, not an array of every possible page. */
export function paginationEntries(page: number, pages: number, siblings = 1): PaginationEntry[] {
  const count = pageCount(pages)
  if (!count)
    return []
  const current = currentPage(page, count)
  const radius = pageCount(siblings)
  const start = Math.max(1, current - radius)
  const end = Math.min(count, current + radius)
  const entries: PaginationEntry[] = []
  if (start > 1) {
    entries.push(1)
    if (start === 3)
      entries.push(2)
    else if (start > 3)
      entries.push('start-gap')
  }
  for (let value = start; value <= end; value++)
    entries.push(value)
  if (end < count) {
    if (end === count - 2)
      entries.push(count - 1)
    else if (end < count - 2)
      entries.push('end-gap')
    entries.push(count)
  }
  return entries
}

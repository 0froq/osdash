import { readCache, writeCache, type CacheStore } from './cache'
import { parseNotificationSubject, type ParsedThread } from '../shared/notifications'

export const NOTIFICATIONS_TTL_SECONDS = 2 * 60
const PAGE = 50
const MAX_PAGES = 6

export type NotificationSnapshot = {
  scope: boolean
  threads: ParsedThread[]
}

type RawNotification = {
  id?: string
  subject?: { url?: string | null }
}

function cacheKey(login: string): string {
  return `notifications:v1:${login.toLowerCase()}`
}

function headers(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'osdash',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export async function loadUnreadNotifications(
  token: string,
  login: string,
  store: CacheStore | undefined,
  nowMs: number,
  fresh: boolean,
): Promise<NotificationSnapshot> {
  if (!fresh) {
    const hit = await readCache(store, cacheKey(login), nowMs)
    if (hit) {
      try {
        return JSON.parse(hit) as NotificationSnapshot
      } catch {
        /* A bad cache entry is a miss. */
      }
    }
  }
  const threads: ParsedThread[] = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = `https://api.github.com/notifications?participating=true&all=false&per_page=${PAGE}&page=${page}`
    const response = await fetch(url, {
      headers: headers(token),
      signal: AbortSignal.timeout(20_000),
    })
    if (response.status === 403 || response.status === 404) {
      const missing: NotificationSnapshot = { scope: false, threads: [] }
      return missing
    }
    if (!response.ok) throw new Error(`GitHub notifications failed: HTTP ${response.status}`)
    const batch = (await response.json()) as RawNotification[]
    if (!Array.isArray(batch) || batch.length === 0) break
    for (const item of batch) {
      const parsed = parseNotificationSubject(item.id ?? '', item.subject?.url)
      if (parsed) threads.push(parsed)
    }
    if (batch.length < PAGE) break
  }
  const snapshot: NotificationSnapshot = { scope: true, threads }
  await writeCache(
    store,
    cacheKey(login),
    JSON.stringify(snapshot),
    NOTIFICATIONS_TTL_SECONDS,
    nowMs,
  )
  return snapshot
}

export async function markThreadsRead(token: string, ids: readonly string[]): Promise<void> {
  for (const id of ids) {
    const response = await fetch(
      `https://api.github.com/notifications/threads/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: headers(token),
        signal: AbortSignal.timeout(20_000),
      },
    )
    if (response.status === 205 || response.status === 200) continue
    if (response.status === 404) continue
    throw new Error(`GitHub mark read failed: HTTP ${response.status}`)
  }
}

export async function forgetThreads(
  login: string,
  ids: readonly string[],
  store: CacheStore | undefined,
  nowMs: number,
): Promise<void> {
  const hit = await readCache(store, cacheKey(login), nowMs)
  if (!hit) return
  let snapshot: NotificationSnapshot
  try {
    snapshot = JSON.parse(hit) as NotificationSnapshot
  } catch {
    return
  }
  const drop = new Set(ids)
  snapshot.threads = snapshot.threads.filter(thread => !drop.has(thread.threadId))
  await writeCache(
    store,
    cacheKey(login),
    JSON.stringify(snapshot),
    NOTIFICATIONS_TTL_SECONDS,
    nowMs,
  )
}

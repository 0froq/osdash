import { readCache, writeCache, type CacheStore } from './cache'
import { checksFromRest, mergeCheckLists, type RawRestCheckRun } from '../shared/checks'
import {
  normalizeRestTimeline,
  type RawRestTimelineEvent,
  type RawReviewComment,
} from '../shared/events'
import { linksFromTimeline } from '../shared/timeline'
import type { Item } from '../shared/turn'

export const TIMELINE_TTL_SECONDS = 6 * 60 * 60
export const CHECKS_TTL_SECONDS = 10 * 60
const POOL = 4

export function timelineCacheKey(
  viewerLogin: string,
  repo: string,
  number: number,
  updatedAt: string | undefined,
): string {
  const base = `${viewerLogin}:${repo}#${number}`
  return updatedAt ? `timeline:v2:${base}:${updatedAt}` : `timeline:v2:${base}`
}

export function checksCacheKey(viewerLogin: string, repo: string, sha: string): string {
  return `checks:v2:${viewerLogin}:${repo}:${sha}`
}

export function cacheViewerLogin(viewerLogin: string): string {
  const login = viewerLogin.trim().toLowerCase()
  if (!login) throw new Error('viewerLogin missing')
  return login
}

export function eventsCacheKey(
  viewerLogin: string,
  repo: string,
  number: number,
  updatedAt: string | undefined,
): string {
  const base = `${cacheViewerLogin(viewerLogin)}:${repo}#${number}`
  return updatedAt ? `events:v1:${base}:${updatedAt}` : `events:v1:${base}`
}

function githubHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'osdash',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export type StopFlag = { stop: boolean }

async function githubJson<T>(token: string, url: string, stop: StopFlag): Promise<T | null> {
  if (stop.stop) return null
  const response = await fetch(url, {
    headers: githubHeaders(token),
    signal: AbortSignal.timeout(20_000),
  })
  if (response.status === 403 || response.status === 429) {
    stop.stop = true
    console.warn(`GitHub REST paused: HTTP ${response.status}`)
    return null
  }
  if (!response.ok) throw new Error(`GitHub REST failed: HTTP ${response.status}`)
  return (await response.json()) as T
}

export async function loadTimeline(
  token: string,
  item: Item,
  stop: StopFlag,
): Promise<{ events: RawRestTimelineEvent[]; truncated: boolean } | null> {
  const events: RawRestTimelineEvent[] = []
  let truncated = false
  for (let page = 1; page <= 3; page++) {
    const url = `https://api.github.com/repos/${item.repo}/issues/${item.number}/timeline?per_page=100&page=${page}`
    const batch = await githubJson<RawRestTimelineEvent[]>(token, url, stop)
    if (!batch) {
      if (stop.stop) truncated = true
      return events.length > 0 ? { events, truncated } : null
    }
    if (!Array.isArray(batch) || batch.length === 0) break
    events.push(...batch)
    if (batch.length < 100) break
    if (page === 3) truncated = true
  }
  return { events, truncated }
}

export async function loadReviewComments(
  token: string,
  item: Item,
  stop: StopFlag,
): Promise<RawReviewComment[] | null> {
  if (item.kind !== 'pr') return []
  const url = `https://api.github.com/repos/${item.repo}/pulls/${item.number}/comments?per_page=100`
  return githubJson(token, url, stop)
}

export async function loadCheckRuns(
  token: string,
  item: Item,
  stop: StopFlag,
): Promise<RawRestCheckRun[] | null> {
  if (!item.headSha) return []
  const url = `https://api.github.com/repos/${item.repo}/commits/${item.headSha}/check-runs?per_page=100`
  const payload = await githubJson<{ check_runs?: RawRestCheckRun[] }>(token, url, stop)
  if (!payload) return null
  return payload.check_runs ?? []
}

async function mapPool(items: Item[], run: (item: Item) => Promise<void>): Promise<void> {
  let index = 0
  const workers = Array.from({ length: Math.min(POOL, items.length) }, async () => {
    while (index < items.length) {
      const current = index
      index += 1
      const item = items[current]
      if (!item) return
      await run(item)
    }
  })
  await Promise.all(workers)
}

export async function enrichItemsFromRest(
  token: string,
  viewerLogin: string,
  items: Item[],
  store: CacheStore | undefined,
  nowMs: number,
  fresh: boolean,
): Promise<void> {
  const stop: StopFlag = { stop: false }
  await mapPool(items, async item => {
    if (stop.stop) return
    try {
      const timelineKey = timelineCacheKey(viewerLogin, item.repo, item.number, item.updatedAt)
      let links = item.timelineLinks ?? []
      if (links.length === 0) {
        const timelineHit = fresh ? null : await readCache(store, timelineKey, nowMs)
        if (timelineHit) {
          links = JSON.parse(timelineHit) as typeof links
        } else {
          const loaded = await loadTimeline(token, item, stop)
          if (loaded) {
            const events = loaded.events
            links = linksFromTimeline(
              events.map(event => ({ ...event, source: event.source ?? undefined })),
            )
            await writeCache(store, timelineKey, JSON.stringify(links), TIMELINE_TTL_SECONDS, nowMs)
            const normalized = normalizeRestTimeline(events, {
              repo: item.repo,
              number: item.number,
              kind: item.kind,
            })
            await writeCache(
              store,
              eventsCacheKey(viewerLogin, item.repo, item.number, item.updatedAt),
              JSON.stringify(normalized),
              TIMELINE_TTL_SECONDS,
              nowMs,
            )
          }
        }
      }
      item.timelineLinks = links

      if (item.kind !== 'pr' || !item.headSha) return
      const checksKey = checksCacheKey(viewerLogin, item.repo, item.headSha)
      const checksHit = fresh ? null : await readCache(store, checksKey, nowMs)
      if (checksHit) {
        item.checks = mergeCheckLists(item.checks, JSON.parse(checksHit) as Item['checks'])
        return
      }
      const runs = await loadCheckRuns(token, item, stop)
      if (!runs) return
      const checks = checksFromRest(runs)
      item.checks = mergeCheckLists(item.checks, checks)
      await writeCache(store, checksKey, JSON.stringify(checks), CHECKS_TTL_SECONDS, nowMs)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GitHub REST failed'
      console.warn(`timeline ${item.repo}#${item.number}: ${message}`)
    }
  })
}

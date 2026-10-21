import { readCache, writeCache, type CacheStore } from './cache'
import {
  CHECKS_TTL_SECONDS,
  TIMELINE_TTL_SECONDS,
  eventsCacheKey,
  loadCheckRuns,
  loadReviewComments,
  loadTimeline,
  type StopFlag,
} from './github-rest'
import {
  foldEntries,
  normalizeCheckRuns,
  normalizeRestTimeline,
  normalizeReviewComments,
  type TimelineEntry,
  type UnitEvent,
} from '../shared/events'
import type { Item, ItemKind } from '../shared/turn'
import type { Unit } from '../shared/unit'

const RESPONSE_TTL_SECONDS = 10 * 60

export type TimelinePayload = {
  id: string
  generatedAt: string
  cached: boolean
  entries: TimelineEntry[]
  truncated: boolean
}

function responseKey(login: string, unitId: string, hash: string): string {
  return `tlresp:v1:${login.toLowerCase()}:${unitId}:${hash}`
}

function reviewKey(
  login: string,
  repo: string,
  number: number,
  updatedAt: string | undefined,
): string {
  const base = `${login.toLowerCase()}:${repo}#${number}`
  return updatedAt ? `revcomments:v1:${base}:${updatedAt}` : `revcomments:v1:${base}`
}

function ciKey(login: string, repo: string, sha: string): string {
  return `ciev:v1:${login.toLowerCase()}:${repo}:${sha}`
}

export function membersHash(unit: Unit): string {
  return unit.members
    .map(
      member =>
        `${member.kind}:${member.repo}#${member.number}:${member.updatedAt ?? ''}:${member.headSha ?? ''}`,
    )
    .join('|')
}

function memberItem(member: Unit['members'][number], viewerLogin: string): Item {
  const kind: ItemKind = member.kind
  return {
    kind,
    repo: member.repo,
    number: member.number,
    title: `${kind} ${member.number}`,
    url: `https://github.com/${member.repo}/${kind === 'pr' ? 'pull' : 'issues'}/${member.number}`,
    state: 'open',
    createdAt: member.updatedAt ?? '1970-01-01T00:00:00.000Z',
    closedAt: null,
    author: { typename: 'User', login: viewerLogin },
    activities: [],
    checks: [],
    updatedAt: member.updatedAt,
    headSha: member.headSha,
    viewerLogin,
  }
}

function dedupeKey(event: UnitEvent): string {
  if ((event.kind === 'cross-ref' || event.kind === 'connected') && event.ref) {
    const pair = [
      `${event.source.repo}#${event.source.number}`,
      `${event.ref.repo}#${event.ref.number}`,
    ].sort()
    return `${event.kind}|${pair.join('~')}|${event.at}`
  }
  return event.id
}

export function mergeTimelineEvents(events: readonly UnitEvent[]): UnitEvent[] {
  const sorted = [...events].sort((left, right) => {
    const at = Date.parse(left.at) - Date.parse(right.at)
    if (at !== 0) return at
    return left.id.localeCompare(right.id)
  })
  const seen = new Set<string>()
  const unique: UnitEvent[] = []
  for (const event of sorted) {
    const key = dedupeKey(event)
    if (seen.has(key) || seen.has(event.id)) continue
    seen.add(key)
    seen.add(event.id)
    unique.push(event)
  }
  return unique
}

async function readJson<T>(
  store: CacheStore | undefined,
  key: string,
  nowMs: number,
  fresh: boolean,
): Promise<T | null> {
  if (fresh) return null
  const hit = await readCache(store, key, nowMs)
  if (!hit) return null
  return JSON.parse(hit) as T
}

export async function assembleTimeline(input: {
  token: string
  login: string
  unit: Unit | null
  store: CacheStore | undefined
  nowMs: number
  fresh: boolean
}): Promise<TimelinePayload | null> {
  const { token, login, unit, store, nowMs, fresh } = input
  if (!unit) return null
  const hash = membersHash(unit)
  const cachedKey = responseKey(login, unit.id, hash)
  const cached = await readJson<TimelinePayload>(store, cachedKey, nowMs, fresh)
  if (cached) return { ...cached, cached: true }

  const stop: StopFlag = { stop: false }
  let truncated = false
  const collected: UnitEvent[] = []

  for (const member of unit.members) {
    const item = memberItem(member, login)
    const source = { repo: member.repo, number: member.number, kind: member.kind }
    const eventKey = eventsCacheKey(login, member.repo, member.number, member.updatedAt)
    let events = await readJson<UnitEvent[]>(store, eventKey, nowMs, fresh)
    if (!events) {
      const loaded = await loadTimeline(token, item, stop)
      if (!loaded) {
        if (stop.stop) truncated = true
        events = []
      } else {
        truncated = truncated || loaded.truncated || stop.stop
        events = normalizeRestTimeline(loaded.events, source)
        await writeCache(store, eventKey, JSON.stringify(events), TIMELINE_TTL_SECONDS, nowMs)
      }
    }
    collected.push(...events)

    if (member.kind !== 'pr') continue

    const commentsKey = reviewKey(login, member.repo, member.number, member.updatedAt)
    let comments = await readJson<UnitEvent[]>(store, commentsKey, nowMs, fresh)
    if (!comments) {
      const raw = await loadReviewComments(token, item, stop)
      if (!raw) {
        if (stop.stop) truncated = true
        comments = []
      } else {
        comments = normalizeReviewComments(raw, source)
        await writeCache(store, commentsKey, JSON.stringify(comments), TIMELINE_TTL_SECONDS, nowMs)
      }
    }
    collected.push(...comments)

    if (!member.headSha) continue
    const checksKey = ciKey(login, member.repo, member.headSha)
    let ci = await readJson<UnitEvent[]>(store, checksKey, nowMs, fresh)
    if (!ci) {
      const runs = await loadCheckRuns(token, item, stop)
      if (!runs) {
        if (stop.stop) truncated = true
        ci = []
      } else {
        ci = normalizeCheckRuns(
          runs.map(run => ({
            name: run.name,
            status: run.status,
            conclusion: run.conclusion,
            html_url: run.html_url,
            started_at: run.started_at,
            completed_at: run.completed_at,
          })),
          source,
          member.headSha,
        )
        await writeCache(store, checksKey, JSON.stringify(ci), CHECKS_TTL_SECONDS, nowMs)
      }
    }
    collected.push(...ci)
  }

  const body: TimelinePayload = {
    id: unit.id,
    generatedAt: new Date(nowMs).toISOString(),
    cached: false,
    entries: foldEntries(mergeTimelineEvents(collected)),
    truncated,
  }
  await writeCache(store, cachedKey, JSON.stringify(body), RESPONSE_TTL_SECONDS, nowMs)
  return body
}

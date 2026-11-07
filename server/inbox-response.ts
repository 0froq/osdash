import type { H3Event } from 'h3'
import { parseClefLogins } from './byok'
import { bindingString, workerEnv } from './bindings'
import { readCache, writeCache, type CacheStore } from './cache'
import { loadUnits } from './github'
import type { NotificationSnapshot } from './notifications'
import type { SessionUser } from './session'
import { inboxCounts } from './user-state'
import { cardNotification, unreadIndex } from '../shared/notifications'
import { summarize } from '../shared/turn'
import type { Unit, UnitView } from '../shared/unit'

export const INBOX_TTL_SECONDS = 10 * 60
export const INBOX_STALE_MS = 2 * 60 * 1000

export type InboxViewer = {
  login: string
  name: string | null
  avatarUrl: string | null
}

export type InboxCacheBody = {
  generatedAt: string
  truncated: boolean
  units: Unit[]
}

export type InboxPayload = {
  generatedAt: string
  cached: boolean
  revalidating?: boolean
  truncated: boolean
  mock: boolean
  notificationsScope: boolean
  viewer: InboxViewer
  counts: ReturnType<typeof inboxCounts>
  stats: ReturnType<typeof summarize>
  units: UnitView[]
}

export function inboxCacheKey(login: string): string {
  return `inbox:v2:${login.toLowerCase()}`
}

export function viewerFromSession(user: SessionUser): InboxViewer {
  return {
    login: user.login,
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
  }
}

export async function loadInboxUnits(
  event: H3Event,
  user: SessionUser,
  now: Date,
  fresh: boolean,
): Promise<InboxCacheBody> {
  const loaded = await loadUnits(
    user.token,
    user.login,
    now,
    {
      AI: workerEnv(event).AI,
      viewerLogin: user.login,
      clefLogins: parseClefLogins(bindingString(event, 'OSDASH_CLEF_LOGINS')),
    },
    { fresh },
  )
  return {
    generatedAt: now.toISOString(),
    truncated: loaded.truncated,
    units: loaded.units,
  }
}

export async function persistInbox(
  store: CacheStore | undefined,
  login: string,
  body: InboxCacheBody,
  nowMs: number,
): Promise<void> {
  await writeCache(store, inboxCacheKey(login), JSON.stringify(body), INBOX_TTL_SECONDS, nowMs)
}

export async function readInboxCache(
  store: CacheStore | undefined,
  login: string,
  nowMs: number,
): Promise<InboxCacheBody | null> {
  const hit = await readCache(store, inboxCacheKey(login), nowMs)
  if (!hit) return null
  try {
    return JSON.parse(hit) as InboxCacheBody
  } catch {
    return null
  }
}

export function presentInbox(
  user: SessionUser,
  body: InboxCacheBody,
  flags: { cached: boolean; revalidating?: boolean; mock: boolean },
  snapshot: NotificationSnapshot,
): InboxPayload {
  const index = unreadIndex(snapshot.scope ? snapshot.threads : [])
  const units = body.units.map(unit => {
    const match = cardNotification(unit.members, index)
    return { ...unit, ...match, notes: [] }
  })
  return {
    generatedAt: body.generatedAt,
    cached: flags.cached,
    revalidating: flags.revalidating,
    truncated: body.truncated,
    mock: flags.mock,
    notificationsScope: snapshot.scope,
    viewer: viewerFromSession(user),
    counts: inboxCounts(units, Date.now()),
    stats: summarize(units),
    units,
  }
}

import type { H3Event } from 'h3'
import { parseClefLogins, readByok } from './byok'
import { bindingString, workerEnv } from './bindings'
import { readCache, writeCache } from './cache'
import { loadUnits } from './github'
import type { SessionUser } from './session'
import {
  inboxCounts,
  mergeUserState,
  readPrefs,
  readSeen,
  type PrefsState,
  type SeenState,
} from './user-state'
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
  viewer: InboxViewer
  counts: ReturnType<typeof inboxCounts>
  stats: ReturnType<typeof summarize>
  units: UnitView[]
}

export function inboxCacheKey(login: string): string {
  return `inbox:v1:${login.toLowerCase()}`
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
  const store = workerEnv(event).CACHE
  const sessionSecret = bindingString(event, 'SESSION_SECRET')
  const byok = sessionSecret ? await readByok(store, sessionSecret, user.login) : null
  const loaded = await loadUnits(
    user.token,
    user.login,
    now,
    {
      AI: workerEnv(event).AI,
      CACHE: store,
      viewerLogin: user.login,
      byok,
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
  store: ReturnType<typeof workerEnv>['CACHE'],
  login: string,
  body: InboxCacheBody,
  nowMs: number,
): Promise<void> {
  await writeCache(store, inboxCacheKey(login), JSON.stringify(body), INBOX_TTL_SECONDS, nowMs)
}

export async function readInboxCache(
  store: ReturnType<typeof workerEnv>['CACHE'],
  login: string,
  nowMs: number,
): Promise<InboxCacheBody | null> {
  const hit = await readCache(store, inboxCacheKey(login), nowMs)
  if (!hit) return null
  return JSON.parse(hit) as InboxCacheBody
}

export async function presentInbox(
  store: ReturnType<typeof workerEnv>['CACHE'],
  user: SessionUser,
  body: InboxCacheBody,
  nowMs: number,
  flags: { cached: boolean; revalidating?: boolean; mock: boolean },
  seenOverride?: SeenState,
  prefsOverride?: PrefsState,
): Promise<InboxPayload> {
  const seen = seenOverride ?? (await readSeen(store, user.login, nowMs))
  const prefs = prefsOverride ?? (await readPrefs(store, user.login, nowMs))
  const units = mergeUserState(body.units, seen, prefs, nowMs)
  return {
    generatedAt: body.generatedAt,
    cached: flags.cached,
    revalidating: flags.revalidating,
    truncated: body.truncated,
    mock: flags.mock,
    viewer: viewerFromSession(user),
    counts: inboxCounts(units, nowMs),
    stats: summarize(units),
    units,
  }
}

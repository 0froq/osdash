import type { H3Event } from 'h3'
import { parseClefLogins, readByok } from './byok'
import { bindingString, workerEnv } from './bindings'
import { readCache, writeCache } from './cache'
import { loadUnits } from './github'
import { createNotionSource } from './notion'
import type { SessionUser } from './session'
import { summarize, type BoardItem, type Turn } from '../shared/turn'
import type { Unit } from '../shared/unit'

function turnOf(unit: Unit): Turn {
  if (unit.ended) return 'none'
  if (unit.myTurn) return 'mine'
  if (unit.reasonCode === 'commented' || unit.reasonCode === 'pushed') return 'other'
  return 'maintainer'
}

function unitToBoardItem(unit: Unit): BoardItem {
  const kind = unit.kind === 'issue-only' ? 'issue' : 'pr'
  return {
    id: `${unit.repo}#${unit.number}`,
    kind,
    repo: unit.repo,
    number: unit.number,
    title: unit.title,
    state: unit.state,
    closedAt: unit.closedAt,
    firstReplyMs: unit.firstReplyMs,
    parts: [
      {
        kind,
        repo: unit.repo,
        number: unit.number,
        url: unit.url,
        title: unit.title,
        authorLogin: '',
      },
    ],
    turn: turnOf(unit),
    reason: unit.reason,
    reasonCode: unit.reasonCode,
    reasonActor: unit.reasonActor,
    labels: unit.labels,
    waitingSince: unit.lastActivityAt,
    ageMs: unit.ageMs,
    tone: unit.tone,
    links: unit.links,
    contributions: unit.tags,
    marks: unit.marks,
    ambiguous: false,
    quote: unit.quote,
    focusCommentId: null,
    focusUpdatedAt: null,
  }
}

export const BOARD_TTL_SECONDS = 10 * 60
export const BOARD_STALE_MS = 2 * 60 * 1000

export type BoardPayload = {
  generatedAt: string
  cached: boolean
  revalidating?: boolean
  truncated: boolean
  mock: boolean
  notion: { connected: boolean }
  stats: ReturnType<typeof summarize>
  items: BoardItem[]
  viewerLogin?: string
}

export function boardCacheKey(login: string): string {
  return `board:v3:${login.toLowerCase()}`
}

export async function buildBoardPayload(
  event: H3Event,
  user: SessionUser,
  now: Date,
  fresh: boolean,
): Promise<BoardPayload> {
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
    cached: false,
    truncated: loaded.truncated,
    mock: false,
    notion: { connected: createNotionSource().connected },
    stats: summarize(loaded.units.map(unitToBoardItem)),
    items: loaded.units.map(unitToBoardItem),
    viewerLogin: user.login,
  }
}

export async function persistBoard(
  store: ReturnType<typeof workerEnv>['CACHE'],
  login: string,
  body: BoardPayload,
  nowMs: number,
): Promise<void> {
  await writeCache(store, boardCacheKey(login), JSON.stringify(body), BOARD_TTL_SECONDS, nowMs)
}

export async function readBoardCache(
  store: ReturnType<typeof workerEnv>['CACHE'],
  login: string,
  nowMs: number,
): Promise<BoardPayload | null> {
  const hit = await readCache(store, boardCacheKey(login), nowMs)
  if (!hit) return null
  return JSON.parse(hit) as BoardPayload
}

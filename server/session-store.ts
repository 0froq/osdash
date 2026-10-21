import { decryptString, encryptString } from './crypto'
import type { CacheStore } from './cache'

export const SESSION_PREFIX = 'session:v1:'
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60

export type SessionRecord = {
  login: string
  token: string
  createdAt: string
}

export type SessionUser = {
  login: string
  token: string
}

function sessionKey(id: string): string {
  return `${SESSION_PREFIX}${id}`
}

export function randomSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function createSession(
  store: CacheStore | undefined,
  secret: string,
  user: SessionUser,
): Promise<string> {
  const id = randomSessionId()
  const record: SessionRecord = {
    login: user.login,
    token: user.token,
    createdAt: new Date().toISOString(),
  }
  const encrypted = await encryptString(secret, JSON.stringify(record))
  await store?.put(sessionKey(id), encrypted, { expirationTtl: SESSION_TTL_SECONDS })
  return id
}

export async function readSession(
  store: CacheStore | undefined,
  secret: string,
  sessionId: string,
): Promise<SessionUser | null> {
  if (!store) return null
  const encrypted = await store.get(sessionKey(sessionId))
  if (!encrypted) return null
  const plain = await decryptString(secret, encrypted)
  if (!plain) return null
  try {
    const record = JSON.parse(plain) as SessionRecord
    if (!record.login || !record.token) return null
    return { login: record.login, token: record.token }
  } catch {
    return null
  }
}

export async function destroySession(
  store: CacheStore | undefined,
  sessionId: string,
): Promise<void> {
  if (!store) return
  await store.put(sessionKey(sessionId), '', { expirationTtl: 1 })
}

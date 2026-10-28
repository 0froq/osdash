import { decryptString, encryptString } from './crypto'

export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60

export type SessionRecord = {
  id?: string
  login: string
  token: string
  createdAt: string
  name?: string
  avatarUrl?: string
}

export type SessionUser = {
  id?: string
  login: string
  token: string
  name?: string
  avatarUrl?: string
}

export async function createSession(secret: string, user: SessionUser): Promise<string> {
  const record: SessionRecord = {
    login: user.login,
    token: user.token,
    createdAt: new Date().toISOString(),
  }
  if (user.id && /^[1-9]\d{0,19}$/.test(user.id)) record.id = user.id
  if (user.name) record.name = user.name
  if (user.avatarUrl) record.avatarUrl = user.avatarUrl
  return encryptString(secret, JSON.stringify(record))
}

export async function readSession(secret: string, sealed: string): Promise<SessionUser | null> {
  const plain = await decryptString(secret, sealed)
  if (!plain) return null
  try {
    const record = JSON.parse(plain) as SessionRecord
    if (!record.login || !record.token) return null
    const user: SessionUser = { login: record.login, token: record.token }
    if (typeof record.id === 'string' && /^[1-9]\d{0,19}$/.test(record.id)) user.id = record.id
    if (record.name) user.name = record.name
    if (record.avatarUrl) user.avatarUrl = record.avatarUrl
    return user
  } catch {
    return null
  }
}

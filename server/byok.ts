import { decryptString, encryptString } from './crypto'
import type { CacheStore } from './cache'

export type ByokSettings = {
  baseUrl: string
  apiKey: string
  model: string
}

const BYOK_PREFIX = 'byok:v1:'
const BYOK_TTL_SECONDS = 365 * 24 * 60 * 60

function byokKey(login: string): string {
  return `${BYOK_PREFIX}${login.toLowerCase()}`
}

export async function readByok(
  store: CacheStore | undefined,
  secret: string,
  login: string,
): Promise<ByokSettings | null> {
  if (!store) return null
  const encrypted = await store.get(byokKey(login))
  if (!encrypted) return null
  const plain = await decryptString(secret, encrypted)
  if (!plain) return null
  try {
    const parsed = JSON.parse(plain) as ByokSettings
    if (!parsed.baseUrl || !parsed.apiKey || !parsed.model) return null
    return parsed
  } catch {
    return null
  }
}

export async function writeByok(
  store: CacheStore | undefined,
  secret: string,
  login: string,
  settings: ByokSettings | null,
): Promise<void> {
  if (!store) return
  if (!settings) {
    await store.put(byokKey(login), '', { expirationTtl: 1 })
    return
  }
  const encrypted = await encryptString(secret, JSON.stringify(settings))
  await store.put(byokKey(login), encrypted, { expirationTtl: BYOK_TTL_SECONDS })
}

export function parseClefLogins(raw: string | undefined | null): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map(entry => entry.trim().toLowerCase())
    .filter(entry => entry.length > 0)
}

export function clefEnabledForUser(
  login: string,
  byok: ByokSettings | null,
  allowList: readonly string[],
): boolean {
  if (usesWorkersAiClef(login, allowList)) return true
  return byok !== null
}

export function usesWorkersAiClef(login: string, allowList: readonly string[]): boolean {
  const needle = login.trim().toLowerCase()
  return allowList.some(entry => entry.trim().toLowerCase() === needle)
}

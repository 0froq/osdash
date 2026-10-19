const memory = new Map<string, { value: string; expiresAt: number }>()

export type CacheStore = {
  get: (key: string) => Promise<string | null>
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>
}

export async function readCache(
  store: CacheStore | undefined,
  key: string,
  nowMs: number,
): Promise<string | null> {
  if (store) return store.get(key)
  const hit = memory.get(key)
  if (!hit || hit.expiresAt <= nowMs) {
    memory.delete(key)
    return null
  }
  return hit.value
}

export async function writeCache(
  store: CacheStore | undefined,
  key: string,
  value: string,
  ttlSeconds: number,
  nowMs: number,
): Promise<void> {
  if (store) {
    await store.put(key, value, { expirationTtl: ttlSeconds })
    return
  }
  memory.set(key, { value, expiresAt: nowMs + ttlSeconds * 1000 })
}

const memory = new Map<string, { value: string; expiresAt: number }>()

type EdgeCache = {
  match(request: Request): Promise<Response | undefined>
  put(request: Request, response: Response): Promise<void>
}

function edgeCache(): EdgeCache | null {
  const caches = (globalThis as { caches?: { default?: EdgeCache } }).caches
  const edge = caches?.default
  if (!edge || typeof edge.match !== 'function' || typeof edge.put !== 'function') return null
  return edge
}

function cacheRequest(key: string): Request {
  return new Request(`https://cache.osdash.internal/${encodeURIComponent(key)}`)
}

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
  const edge = edgeCache()
  if (edge) {
    const hit = await edge.match(cacheRequest(key))
    return hit ? hit.text() : null
  }
  const hit = memory.get(key)
  if (!hit || hit.expiresAt <= nowMs) {
    memory.delete(key)
    return null
  }
  return hit.value
}

export async function readStored(
  store: CacheStore | undefined,
  key: string,
  nowMs: number,
): Promise<string | null> {
  return readCache(store, key, nowMs)
}

export async function writeStored(
  store: CacheStore | undefined,
  key: string,
  value: string,
): Promise<void> {
  if (store) {
    await store.put(key, value)
    return
  }
  memory.set(key, { value, expiresAt: Number.POSITIVE_INFINITY })
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
  const edge = edgeCache()
  if (edge) {
    await edge.put(
      cacheRequest(key),
      new Response(value, { headers: { 'cache-control': `public, max-age=${ttlSeconds}` } }),
    )
    return
  }
  memory.set(key, { value, expiresAt: nowMs + ttlSeconds * 1000 })
}

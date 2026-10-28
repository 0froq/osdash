import {
  createError,
  getHeader,
  getRequestWebStream,
  setHeader,
  setResponseStatus,
  type H3Event,
} from 'h3'
import { isLocalAccount, type LocalAccount } from '../shared/local-bridge'
import { parseNoteOperation, type RelayStub } from '../shared/device-relay'
import { workerEnv } from './bindings'
import { readCache, writeCache } from './cache'
import { fetchGitHubUser } from './auth/github-oauth'
import { getRequestOrigin } from './request-origin'

export function sameOrigin(event: H3Event) {
  setHeader(event, 'Cache-Control', 'no-store')
  if (getHeader(event, 'origin') !== getRequestOrigin(event))
    throw createError({ statusCode: 403, statusMessage: 'Origin denied' })
}
export async function deviceAccount(event: H3Event): Promise<LocalAccount> {
  setHeader(event, 'Cache-Control', 'no-store')
  const user = event.context.osdashUser
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  const account = { id: user.id, login: user.login }
  if (isLocalAccount(account)) return account
  // Legacy sessions predate numeric IDs. This is authentication metadata, not a notes cache.
  const key = `auth-account:v1:${user.login.toLowerCase()}`
  const cached = await readCache(undefined, key, Date.now())
  try {
    const value: unknown = cached ? JSON.parse(cached) : null
    if (isLocalAccount(value) && value.login.toLowerCase() === user.login.toLowerCase())
      return value
  } catch {
    /* A malformed cache entry is not an identity. */
  }
  const profile = await fetchGitHubUser(user.token)
  if (profile.login.toLowerCase() !== user.login.toLowerCase())
    throw createError({ statusCode: 401, statusMessage: 'Sign in again to confirm your account' })
  const verified = { id: profile.id, login: profile.login }
  if (!isLocalAccount(verified))
    throw createError({ statusCode: 401, statusMessage: 'Invalid account identity' })
  await writeCache(undefined, key, JSON.stringify(verified), 600, Date.now())
  user.id = verified.id
  return verified
}
export function deviceStub(event: H3Event, account: LocalAccount): RelayStub {
  const relay = workerEnv(event).DEVICE_RELAY
  if (!relay)
    throw createError({ statusCode: 503, statusMessage: 'Storage device relay unavailable' })
  return relay.getByName(`${workerEnv(event).DEVICE_RELAY_SCOPE ?? 'production'}:${account.id}`)
}
async function readDeviceBody(event: H3Event): Promise<string> {
  // Nitro's Workers adapter supplies the body without emitting Node data/end events.
  if (event.web || '__unenv__' in event.node.req) {
    const reader = getRequestWebStream(event)?.getReader()
    if (!reader) return ''
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 80 * 1024) {
          await reader.cancel().catch(() => {})
          throw createError({ statusCode: 413, statusMessage: 'Request too large' })
        }
        chunks.push(value)
      }
      return Buffer.concat(chunks).toString('utf8')
    } finally {
      reader.releaseLock()
    }
  }
  return new Promise<string>((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    event.node.req.on('data', (chunk: Buffer | string) => {
      const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += value.length
      if (size > 80 * 1024) {
        reject(createError({ statusCode: 413, statusMessage: 'Request too large' }))
        return
      }
      chunks.push(value)
    })
    event.node.req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    event.node.req.on('error', reject)
    event.node.req.on('aborted', () =>
      reject(createError({ statusCode: 400, statusMessage: 'Request aborted' })),
    )
  })
}
export async function deviceBody(event: H3Event): Promise<Record<string, unknown>> {
  if (getHeader(event, 'content-type')?.split(';')[0]?.trim() !== 'application/json')
    throw createError({ statusCode: 415, statusMessage: 'JSON required' })
  const text = await readDeviceBody(event)
  try {
    const body: unknown = JSON.parse(text)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body')
    return body as Record<string, unknown>
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' })
  }
}
export async function relayNotes(event: H3Event, value: unknown) {
  const account = await deviceAccount(event)
  let operation
  try {
    operation = parseNoteOperation(value)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid note operation or version' })
  }
  const result = await deviceStub(event, account).request(operation)
  setResponseStatus(event, result.status)
  return result.body
}

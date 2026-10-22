const STATE_VERSION = 'v1'
const PREVIEW_ORIGIN = /^https:\/\/[a-z0-9-]+-osdash\.sayhola\.workers\.dev$/
const PRODUCTION_ORIGIN = 'https://osdash.froq.me'

export type OAuthStatePayload = {
  origin: string
  exp: number
  nonce: string
}

export type CallbackOriginConfig =
  | { status: 'unset' }
  | { status: 'invalid' }
  | { status: 'set'; origin: string }

export type OAuthStart =
  | { ok: true; mode: 'legacy'; redirectUri: string }
  | { ok: true; mode: 'fixed'; redirectUri: string; returnOrigin: string }
  | { ok: false }

export type OAuthCallbackPlan =
  | { action: 'bounce'; location: string }
  | { action: 'exchange'; redirectUri: string }
  | { action: 'reject' }

export function parseCallbackOrigin(raw: string | undefined): CallbackOriginConfig {
  if (raw === undefined) return { status: 'unset' }
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return { status: 'invalid' }
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return { status: 'invalid' }
  }
  if (url.origin !== trimmed) return { status: 'invalid' }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { status: 'invalid' }
  return { status: 'set', origin: trimmed }
}

export function isAllowedReturnOrigin(origin: string): boolean {
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    return false
  }
  if (url.origin !== origin || url.username || url.password) return false
  if (PREVIEW_ORIGIN.test(origin)) return true
  if (origin === PRODUCTION_ORIGIN) return true
  return isLocalOrigin(url)
}

export function resolveOAuthStart(
  requestOrigin: string,
  callbackOrigin: string | undefined,
): OAuthStart {
  if (!callbackOrigin) {
    return { ok: true, mode: 'legacy', redirectUri: `${requestOrigin}/api/auth/callback` }
  }
  if (!isAllowedReturnOrigin(requestOrigin)) return { ok: false }
  return {
    ok: true,
    mode: 'fixed',
    redirectUri: `${callbackOrigin}/api/auth/callback`,
    returnOrigin: requestOrigin,
  }
}

export function planOAuthCallback(input: {
  requestOrigin: string
  callbackOrigin: string
  verifiedOrigin: string | null
  code: string
  state: string
}): OAuthCallbackPlan {
  const { requestOrigin, callbackOrigin, verifiedOrigin, code, state } = input
  if (!verifiedOrigin || !isAllowedReturnOrigin(verifiedOrigin)) return { action: 'reject' }
  if (requestOrigin !== verifiedOrigin) {
    return { action: 'bounce', location: branchCallbackLocation(verifiedOrigin, code, state) }
  }
  return { action: 'exchange', redirectUri: `${callbackOrigin}/api/auth/callback` }
}

export function branchCallbackLocation(origin: string, code: string, state: string): string {
  const url = new URL('/api/auth/callback', origin)
  url.searchParams.set('code', code)
  url.searchParams.set('state', state)
  return url.toString()
}

export async function signOAuthState(
  secret: string,
  input: { origin: string; exp: number; nonce?: string },
): Promise<string> {
  const payload: OAuthStatePayload = {
    origin: input.origin,
    exp: input.exp,
    nonce: input.nonce ?? randomNonce(),
  }
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const sig = await hmacSha256(secret, body)
  return `${STATE_VERSION}.${body}.${sig}`
}

export async function verifyOAuthState(
  secret: string,
  state: string,
  nowMs: number,
): Promise<OAuthStatePayload | null> {
  const parts = state.split('.')
  if (parts.length !== 3) return null
  const version = parts[0]
  const body = parts[1]
  const sig = parts[2]
  if (version !== STATE_VERSION || !body || !sig) return null
  const ok = await hmacVerify(secret, body, sig)
  if (!ok) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(body)))
  } catch {
    return null
  }
  if (!isPayload(parsed)) return null
  if (parsed.exp <= nowMs) return null
  return parsed
}

function isLocalOrigin(url: URL): boolean {
  const host = url.hostname
  if (host !== 'localhost' && host !== '127.0.0.1' && host !== '::1') return false
  return url.protocol === 'http:' || url.protocol === 'https:'
}

function isPayload(value: unknown): value is OAuthStatePayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as Record<string, unknown>
  return (
    typeof payload.origin === 'string' &&
    payload.origin.length > 0 &&
    typeof payload.exp === 'number' &&
    Number.isFinite(payload.exp) &&
    typeof payload.nonce === 'string' &&
    payload.nonce.length > 0
  )
}

function randomNonce(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(16)))
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return toBase64Url(new Uint8Array(sig))
}

async function hmacVerify(secret: string, message: string, sig: string): Promise<boolean> {
  let bytes: Uint8Array
  try {
    bytes = fromBase64Url(sig)
  } catch {
    return false
  }
  const key = await hmacKey(secret)
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return crypto.subtle.verify('HMAC', key, copy, new TextEncoder().encode(message))
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)!
  return bytes
}

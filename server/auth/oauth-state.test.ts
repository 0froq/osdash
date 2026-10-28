import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import {
  branchCallbackLocation,
  isAllowedReturnOrigin,
  parseCallbackOrigin,
  planOAuthCallback,
  resolveOAuthStart,
  signOAuthState,
  verifyOAuthState,
} from './oauth-state'

const SECRET = 'session-secret'
const NOW = Date.parse('2026-10-22T12:00:00.000Z')
const PREVIEW = 'https://feat-osdash.sayhola.workers.dev'
const CALLBACK = 'https://main-osdash.sayhola.workers.dev'

it('signs state and returns the origin, expiry, and nonce', async () => {
  const state = await signOAuthState(SECRET, { origin: PREVIEW, exp: NOW + 60_000, nonce: 'n1' })
  const payload = await verifyOAuthState(SECRET, state, NOW)
  assert.deepEqual(payload, { origin: PREVIEW, exp: NOW + 60_000, nonce: 'n1' })
})

it('rejects an expired state at the deadline', async () => {
  const state = await signOAuthState(SECRET, { origin: PREVIEW, exp: NOW, nonce: 'n1' })
  assert.equal(await verifyOAuthState(SECRET, state, NOW), null)
})

it('rejects a tampered origin and a bad signature', async () => {
  const state = await signOAuthState(SECRET, { origin: PREVIEW, exp: NOW + 60_000, nonce: 'n1' })
  const [version, body, sig] = state.split('.')
  assert.ok(version && body && sig)
  const flipped = `${body.slice(0, -1)}${body.endsWith('A') ? 'B' : 'A'}`
  assert.equal(await verifyOAuthState(SECRET, `${version}.${flipped}.${sig}`, NOW), null)
  assert.equal(await verifyOAuthState(SECRET, `${version}.${body}.${sig.slice(0, -1)}A`, NOW), null)
  assert.equal(await verifyOAuthState('other-secret', state, NOW), null)
})

it('allows preview, production, and local origins only', () => {
  assert.equal(isAllowedReturnOrigin(PREVIEW), true)
  assert.equal(isAllowedReturnOrigin(CALLBACK), true)
  assert.equal(isAllowedReturnOrigin('https://osdash.froq.me'), true)
  assert.equal(isAllowedReturnOrigin('http://localhost:3000'), true)
  assert.equal(isAllowedReturnOrigin('http://127.0.0.1:8787'), true)

  assert.equal(isAllowedReturnOrigin('https://evil-osdash.sayhola.workers.dev.attacker.com'), false)
  assert.equal(isAllowedReturnOrigin('evil-osdash.sayhola.workers.dev.attacker.com'), false)
  assert.equal(isAllowedReturnOrigin('http://feat-osdash.sayhola.workers.dev'), false)
  assert.equal(isAllowedReturnOrigin('http://osdash.froq.me'), false)
  assert.equal(isAllowedReturnOrigin('https://preview.sayhola.workers.dev'), false)
  assert.equal(isAllowedReturnOrigin('https://feat-osdash.example.workers.dev'), false)
  assert.equal(isAllowedReturnOrigin('https://osdash.sayhola.workers.dev'), false)
  assert.equal(isAllowedReturnOrigin('https://evil.example'), false)
  assert.equal(isAllowedReturnOrigin(`${PREVIEW}/api/auth/callback`), false)
})

it('signs against the request origin when the callback origin is unset', () => {
  const start = resolveOAuthStart('https://osdash.froq.me', undefined)
  assert.deepEqual(start, {
    ok: true,
    mode: 'fixed',
    redirectUri: 'https://osdash.froq.me/api/auth/callback',
    returnOrigin: 'https://osdash.froq.me',
  })
  assert.equal(resolveOAuthStart('https://evil.example', undefined).ok, false)
  assert.deepEqual(parseCallbackOrigin(undefined), { status: 'unset' })
})

it('pins redirect_uri to the configured callback and bounces other previews back', () => {
  const start = resolveOAuthStart(PREVIEW, CALLBACK)
  assert.deepEqual(start, {
    ok: true,
    mode: 'fixed',
    redirectUri: `${CALLBACK}/api/auth/callback`,
    returnOrigin: PREVIEW,
  })
  assert.equal(resolveOAuthStart('https://evil.example', CALLBACK).ok, false)

  const bounce = planOAuthCallback({
    requestOrigin: CALLBACK,
    callbackOrigin: CALLBACK,
    verifiedOrigin: PREVIEW,
    code: 'abc',
    state: 'v1.body.sig',
  })
  assert.deepEqual(bounce, {
    action: 'bounce',
    location: branchCallbackLocation(PREVIEW, 'abc', 'v1.body.sig'),
  })
  assert.equal(
    branchCallbackLocation(PREVIEW, 'abc', 'v1.body.sig'),
    `${PREVIEW}/api/auth/callback?code=abc&state=v1.body.sig`,
  )

  const exchange = planOAuthCallback({
    requestOrigin: PREVIEW,
    callbackOrigin: CALLBACK,
    verifiedOrigin: PREVIEW,
    code: 'abc',
    state: 'v1.body.sig',
  })
  assert.deepEqual(exchange, {
    action: 'exchange',
    redirectUri: `${CALLBACK}/api/auth/callback`,
  })

  assert.equal(
    planOAuthCallback({
      requestOrigin: CALLBACK,
      callbackOrigin: CALLBACK,
      verifiedOrigin: 'https://evil-osdash.sayhola.workers.dev.attacker.com',
      code: 'abc',
      state: 'v1.body.sig',
    }).action,
    'reject',
  )
  assert.equal(
    planOAuthCallback({
      requestOrigin: CALLBACK,
      callbackOrigin: CALLBACK,
      verifiedOrigin: null,
      code: 'abc',
      state: 'v1.body.sig',
    }).action,
    'reject',
  )
})

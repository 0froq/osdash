import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp, defineEventHandler, getHeader, toNodeListener } from 'h3'
import { it, vi } from 'vite-plus/test'

const mocks = vi.hoisted(() => ({
  profile: { id: '123', login: 'octocat' },
  lookup: vi.fn(async (_token: string) => mocks.profile),
}))
vi.mock('./bindings', () => ({ bindingString: () => 'test-session-secret' }))
vi.mock('./auth/github-oauth', () => ({ fetchGitHubUser: mocks.lookup }))
import grantHandler from './api/local/grant.post'
import verifyHandler from './api/local/verify.post'

it('requires an authenticated same-origin session and verifies the GitHub identity before issuing a grant', async () => {
  const app = createApp()
  app.use(
    defineEventHandler(event => {
      if (getHeader(event, 'x-test-session'))
        event.context.osdashUser = { login: 'octocat', token: 'server-only-token' }
    }),
  )
  app.use('/api/local/grant', grantHandler)
  app.use('/api/local/verify', verifyHandler)
  const server = createServer(toNodeListener(app))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const origin = `http://127.0.0.1:${address.port}`
  const challenge = 'x'.repeat(32)
  const call = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(origin + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
  try {
    mocks.lookup.mockClear()
    assert.equal((await call('/api/local/grant', { challenge })).status, 401)
    assert.equal(
      (
        await call(
          '/api/local/grant',
          { challenge },
          { 'Origin': 'https://evil.example', 'x-test-session': '1' },
        )
      ).status,
      403,
    )
    assert.equal(mocks.lookup.mock.calls.length, 0)
    const headers = { 'Origin': origin, 'x-test-session': '1' }
    assert.equal((await call('/api/local/grant', { challenge: '../invalid' }, headers)).status, 400)
    const response = await call(
      '/api/local/grant',
      { challenge, account: { id: '999', login: 'spoofed' } },
      headers,
    )
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    const issued = (await response.json()) as { grant: string; account: unknown }
    assert.deepEqual(issued.account, { id: '123', login: 'octocat' })
    assert.deepEqual(mocks.lookup.mock.calls[0], ['server-only-token'])
    assert.ok(!JSON.stringify(issued).includes('server-only-token'))
    const verified = await call('/api/local/verify', { grant: issued.grant, challenge })
    assert.equal(verified.status, 200)
    assert.deepEqual(await verified.json(), { account: issued.account })
    assert.equal(
      (await call('/api/local/verify', { grant: issued.grant, challenge: 'y'.repeat(32) })).status,
      403,
    )
    assert.equal((await call('/api/local/verify', { grant: 'forged', challenge })).status, 403)
    mocks.profile = { id: '456', login: 'someone-else' }
    assert.equal((await call('/api/local/grant', { challenge }, headers)).status, 401)
  } finally {
    mocks.profile = { id: '123', login: 'octocat' }
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
})

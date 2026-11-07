import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp, defineEventHandler, getHeader, toNodeListener } from 'h3'
import { it, vi } from 'vite-plus/test'
import type { RelayStub } from '../shared/device-relay'

const mocks = vi.hoisted(() => ({ lookup: vi.fn(async () => ({ id: '123', login: 'alice' })) }))
vi.mock('./auth/github-oauth', () => ({ fetchGitHubUser: mocks.lookup }))
import statusHandler from './api/device/status.get'
import listHandler from './api/device/notes.get'
import catalogHandler from './api/device/catalog.get'
import saveHandler from './api/device/notes.post'
import deleteHandler from './api/device/notes.delete'
import unlinkHandler from './api/device/index.delete'

it('routes browser note operations only by the authenticated numeric ID and protects mutations with Origin', async () => {
  const routed: string[] = []
  const requests: unknown[] = []
  const revoked: string[] = []
  const stub: RelayStub = {
    register: async () => {
      throw new Error('not used')
    },
    status: async () => ({
      id: 'device',
      name: 'Mini',
      pairedAt: '',
      online: true,
      revision: 'r1',
    }),
    revoke: async id => {
      revoked.push(id)
    },
    request: async operation => {
      requests.push(operation)
      return { status: 200, body: { notes: [], versions: {} } }
    },
  }
  const app = createApp()
  app.use(
    defineEventHandler(event => {
      const id = getHeader(event, 'x-test-account')
      if (id)
        event.context.osdashUser = {
          id: id.startsWith('legacy') ? undefined : id,
          login: id === '123' || id === 'legacy' ? 'alice' : 'bob',
          token: 'server-only-token',
        }
      event.context.cloudflare = {
        env: {
          DEVICE_RELAY: {
            getByName: name => {
              routed.push(name)
              return stub
            },
          },
        },
      }
    }),
  )
  app.use('/api/device/status', statusHandler)
  app.use('/api/device/catalog', catalogHandler)
  app.use(
    '/api/device/notes',
    defineEventHandler(event =>
      event.method === 'GET'
        ? listHandler(event)
        : event.method === 'POST'
          ? saveHandler(event)
          : deleteHandler(event),
    ),
  )
  app.use('/api/device', unlinkHandler)
  const server = createServer(toNodeListener(app))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const origin = `http://127.0.0.1:${address.port}`
  const call = (path: string, method = 'GET', body?: unknown, extra: Record<string, string> = {}) =>
    fetch(origin + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'Origin': origin, ...extra },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  const unit = 'pr:owner/repo#42'
  const note = {
    id: 'a1234567-1234-4567-89ab-123456789abc',
    text: 'private',
    at: new Date().toISOString(),
    anchor: new Date().toISOString(),
  }
  try {
    assert.equal((await call('/api/device/status')).status, 401)
    assert.equal((await call('/api/device/catalog')).status, 401)
    assert.equal(routed.length, 0)
    assert.equal(
      (
        await call(
          '/api/device/notes',
          'POST',
          { unit, note, version: null },
          { 'x-test-account': '123', 'Origin': 'https://evil.example' },
        )
      ).status,
      403,
    )
    assert.equal(routed.length, 0)
    const legacy = { 'x-test-account': 'legacy', 'Cookie': 'osdash_session=legacy-device-api-test' }
    mocks.lookup.mockClear()
    assert.equal((await call('/api/device/status', 'GET', undefined, legacy)).status, 200)
    assert.equal((await call('/api/device/status', 'GET', undefined, legacy)).status, 200)
    assert.equal(mocks.lookup.mock.calls.length, 1)
    assert.equal(routed.at(-1), 'production:123')
    assert.equal(
      (
        await call('/api/device/status', 'GET', undefined, {
          ...legacy,
          'x-test-account': 'legacy-bob',
        })
      ).status,
      401,
    )
    const headers = { 'x-test-account': '123' }
    const cursor = 'pr:owner/repo#42:global:' + note.id
    assert.equal(
      (
        await call(
          '/api/device/catalog?account=456&after=' + encodeURIComponent(cursor),
          'GET',
          undefined,
          headers,
        )
      ).status,
      200,
    )
    assert.equal(routed.at(-1), 'production:123')
    assert.deepEqual(requests.at(-1), { action: 'catalog', after: cursor })
    assert.equal(
      (await call('/api/device/catalog?after=' + 'x'.repeat(513), 'GET', undefined, headers))
        .status,
      400,
    )
    assert.equal(
      (await call('/api/device/status?account=456', 'GET', undefined, headers)).status,
      200,
    )
    assert.equal(routed.at(-1), 'production:123')
    assert.equal(
      (
        await call(
          '/api/device/notes',
          'POST',
          { unit, note, version: null, account: '456' },
          headers,
        )
      ).status,
      200,
    )
    assert.equal(routed.at(-1), 'production:123')
    assert.deepEqual(requests.at(-1), { action: 'save', unit, note, version: null })
    assert.equal(
      (
        await call('/api/device/notes?unit=' + encodeURIComponent(unit), 'GET', undefined, {
          'x-test-account': '456',
        })
      ).status,
      200,
    )
    assert.equal(routed.at(-1), 'production:456')
    assert.equal(
      (
        await call(
          '/api/device/notes',
          'DELETE',
          { unit, noteId: note.id, version: 'a'.repeat(64), source: 'repo:' + 'b'.repeat(16) },
          headers,
        )
      ).status,
      200,
    )
    assert.deepEqual(requests.at(-1), {
      action: 'delete',
      unit,
      noteId: note.id,
      version: 'a'.repeat(64),
      source: 'repo:' + 'b'.repeat(16),
    })
    assert.equal((await call('/api/device/notes', 'POST', { unit, note }, headers)).status, 400)
    assert.equal(
      (
        await call(
          '/api/device/notes',
          'POST',
          { unit: 'pr:owner/..#42', note, version: null },
          headers,
        )
      ).status,
      400,
    )
    assert.equal(
      (
        await call(
          '/api/device/notes',
          'POST',
          { unit, note: { ...note, text: 'x'.repeat(90_000) }, version: null },
          headers,
        )
      ).status,
      413,
    )
    assert.equal(
      (await call('/api/device', 'DELETE', { id: 'device', account: '456' }, headers)).status,
      200,
    )
    assert.deepEqual(revoked, ['device'])
    assert.equal(routed.at(-1), 'production:123')
  } finally {
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
})

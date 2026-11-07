import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp, defineEventHandler, getHeader, toNodeListener } from 'h3'
import { it } from 'vite-plus/test'
import viewer from './api/auth/me.get'

it('returns only the session profile for Notes without a GitHub request or token disclosure', async () => {
  const app = createApp()
  app.use(
    defineEventHandler(event => {
      if (getHeader(event, 'x-session'))
        event.context.osdashUser = {
          id: '123',
          login: 'octocat',
          name: 'Octocat',
          token: 'server-only-token',
        }
    }),
  )
  app.use('/api/auth/me', viewer)
  const server = createServer(toNodeListener(app))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  try {
    const url = `http://127.0.0.1:${address.port}/api/auth/me`
    assert.deepEqual(await (await fetch(url)).json(), { authenticated: false })
    const response = await fetch(url, { headers: { 'x-session': '1' } })
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), {
      authenticated: true,
      login: 'octocat',
      name: 'Octocat',
      avatarUrl: null,
    })
  } finally {
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
})

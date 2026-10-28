import assert from 'node:assert/strict'
import { createApp, defineEventHandler, toWebHandler } from 'h3'
import { it } from 'vite-plus/test'
import { deviceBody } from './device-api'

it('reads bounded JSON through the Fetch adapter without waiting for Node stream events', async () => {
  const app = createApp()
  app.use(defineEventHandler(event => deviceBody(event)))
  const handler = toWebHandler(app)
  const request = (body: string, contentType = 'application/json') =>
    handler(
      new Request('https://fixture.example/api/device/register', {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
      }),
    )
  const body = { name: 'Mini', text: '中文笔记' }
  const response = await request(JSON.stringify(body), 'application/json; charset=utf-8')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), body)
  assert.equal((await request('{')).status, 400)
  assert.equal((await request('[]')).status, 400)
  assert.equal((await request('{}', 'application/jsonp')).status, 415)
  assert.equal((await request(JSON.stringify({ text: '中'.repeat(30_000) }))).status, 413)
})

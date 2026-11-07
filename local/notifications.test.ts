import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { pollNotifications, PollBackoff } from './notifications'

const thread = (id: string, time = '2026-10-29T00:00:00Z') => ({
  id,
  updated_at: time,
  subject: { title: `Thread ${id}`, type: 'PullRequest' },
})
it('baselines quietly, detects replies on existing unread threads, sends conditional headers and honors poll intervals', async () => {
  const calls: RequestInit[] = []
  const request = async (_url: string | URL | Request, init?: RequestInit) => {
    calls.push(init!)
    return Response.json([thread('1')], {
      headers: { 'Last-Modified': 'Thu, 29 Oct 2026 00:00:00 GMT', 'X-Poll-Interval': '60' },
    })
  }
  const first = await pollNotifications('test-token', '123', null, 10, request)
  assert.equal(first.changes.length, 0)
  assert.equal(first.seconds, 60)
  const second = await pollNotifications(
    'test-token',
    '123',
    first.state,
    120,
    async (_url, init) => {
      assert.equal(new Headers(init?.headers).get('if-modified-since'), first.state.lastModified)
      return Response.json([thread('1', '2026-10-29T01:00:00Z'), thread('2')])
    },
  )
  assert.deepEqual(
    second.changes.map(row => row.id),
    ['1', '2'],
  )
  assert.equal(second.seconds, 120)
  const unchanged = await pollNotifications(
    'test-token',
    '123',
    second.state,
    10,
    async () => new Response(null, { status: 304, headers: { 'X-Poll-Interval': '90' } }),
  )
  assert.equal(unchanged.state, second.state)
  assert.equal(unchanged.seconds, 90)
  assert.equal(unchanged.changes.length, 0)
  assert.equal(new Headers(calls[0]!.headers).get('if-modified-since'), null)
})

it('keeps failed polls from advancing state and obeys retry-after', async () => {
  await assert.rejects(
    pollNotifications(
      'test',
      '123',
      null,
      10,
      async () => new Response(null, { status: 429, headers: { 'Retry-After': '300' } }),
    ),
    (error: unknown) => error instanceof PollBackoff && error.seconds === 300,
  )
  const previous = {
    accountId: '123',
    lastModified: 'before',
    seen: { '1': '2026-10-28T00:00:00Z' },
  }
  let page = 0
  await assert.rejects(
    pollNotifications('test', '123', previous, 10, async () =>
      ++page === 1
        ? Response.json(Array.from({ length: 50 }, (_, i) => thread(String(i + 1))))
        : new Response(null, { status: 500 }),
    ),
  )
  assert.deepEqual(previous, {
    accountId: '123',
    lastModified: 'before',
    seen: { '1': '2026-10-28T00:00:00Z' },
  })
})

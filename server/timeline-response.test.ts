import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import type { CacheStore } from './cache'
import { mockUnits } from './mock'
import { assembleTimeline, membersHash } from './timeline-response'
import type { TimelinePayload } from './timeline-response'
import type { Unit } from '../shared/unit'

const NOW = Date.parse('2026-10-19T12:00:00.000Z')

function memoryStore(): CacheStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    async get(key) {
      return data.get(key) ?? null
    },
    async put(key, value) {
      if (value === '') data.delete(key)
      else data.set(key, value)
    },
  }
}

function fixtureUnit(): Unit {
  const unit = structuredClone(mockUnits(NOW).find(entry => entry.kind === 'pr')!)
  unit.id = 'pr:acme/app#12'
  unit.members = [
    {
      repo: 'acme/app',
      number: 12,
      kind: 'pr',
      updatedAt: '2026-10-01T00:00:00.000Z',
      headSha: 'abc',
    },
    { repo: 'acme/app', number: 4, kind: 'issue', updatedAt: '2026-10-01T00:00:00.000Z' },
  ]
  return unit
}

function respond(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 })
}

it('merges pull request and issue events in time order and drops a duplicate cross-reference', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async input => {
    const url = String(input)
    if (url.includes('/issues/12/timeline')) {
      return respond([
        {
          id: 'pr-comment',
          event: 'commented',
          created_at: '2026-10-03T00:00:00.000Z',
          actor: { login: 'octo-dev', type: 'User' },
          body: 'Pushed the fix.',
        },
        {
          id: 'xref-pr',
          event: 'cross-referenced',
          created_at: '2026-10-02T00:00:00.000Z',
          actor: { login: 'octo-dev', type: 'User' },
          source: {
            issue: {
              number: 4,
              html_url: 'https://github.com/acme/app/issues/4',
              repository_url: 'https://api.github.com/repos/acme/app',
            },
          },
        },
      ])
    }
    if (url.includes('/issues/4/timeline')) {
      return respond([
        {
          id: 'issue-comment',
          event: 'commented',
          created_at: '2026-10-01T00:00:00.000Z',
          actor: { login: 'pi0', type: 'User' },
          body: 'It tears.',
        },
        {
          id: 'xref-issue',
          event: 'cross-referenced',
          created_at: '2026-10-02T00:00:00.000Z',
          actor: { login: 'octo-dev', type: 'User' },
          source: {
            issue: {
              number: 12,
              html_url: 'https://github.com/acme/app/pull/12',
              repository_url: 'https://api.github.com/repos/acme/app',
              pull_request: {},
            },
          },
        },
      ])
    }
    if (url.includes('/pulls/12/comments')) return respond([])
    if (url.includes('/check-runs')) return respond({ check_runs: [] })
    return new Response('missing', { status: 404 })
  }
  try {
    const body = await assembleTimeline({
      token: 'token',
      login: 'octo-dev',
      unit: fixtureUnit(),
      store: memoryStore(),
      nowMs: NOW,
      fresh: true,
    })
    assert.ok(body)
    const times = body.entries.map(entry => ('at' in entry ? entry.at : ''))
    assert.deepEqual(times, [
      '2026-10-01T00:00:00.000Z',
      '2026-10-02T00:00:00.000Z',
      '2026-10-03T00:00:00.000Z',
    ])
    assert.equal(body.entries.filter(entry => entry.kind === 'cross-ref').length, 1)
  } finally {
    globalThis.fetch = original
  }
})

it('keeps a downstream reference as an event without expanding its PR or reading old derived caches', async () => {
  const unit = fixtureUnit()
  unit.repo = 'acme/app'
  unit.number = 12
  unit.history = []
  unit.fixedBy = null
  unit.issues = [
    {
      repo: 'acme/app',
      number: 4,
      url: 'https://github.com/acme/app/issues/4',
      title: 'upstream bug',
      state: 'open',
      authorLogin: 'other',
      link: 'closing',
      sharedWith: [],
    },
  ]
  const store = memoryStore()
  store.data.set(
    `tlresp:v2:octo-dev:${unit.id}:${membersHash(unit)}`,
    JSON.stringify({
      id: unit.id,
      generatedAt: new Date(NOW).toISOString(),
      entries: [],
      items: [],
      truncated: true,
    }),
  )
  const calls: string[] = []
  const original = globalThis.fetch
  globalThis.fetch = async input => {
    const url = String(input)
    calls.push(url)
    if (url.includes('/issues/4/timeline'))
      return respond([
        {
          id: 'downstream-ref',
          event: 'cross-referenced',
          created_at: '2026-10-18T00:00:00Z',
          actor: { login: 'PhyberApex', type: 'User' },
          source: {
            issue: {
              number: 942,
              html_url: 'https://github.com/PhyberApex/lightning-talks/pull/942',
              repository_url: 'https://api.github.com/repos/PhyberApex/lightning-talks',
              pull_request: {},
            },
          },
        },
      ])
    return respond(url.includes('/check-runs') ? { check_runs: [] } : [])
  }
  try {
    const body = await assembleTimeline({
      token: 'token',
      login: 'octo-dev',
      unit,
      store,
      nowMs: NOW,
      fresh: false,
    })
    assert.ok(body)
    assert.equal(body.cached, false)
    assert.equal(body.entries.filter(entry => entry.kind === 'cross-ref').length, 1)
    assert.deepEqual(
      body.items.map(item => item.key),
      ['acme/app#12', 'acme/app#4'],
    )
    assert.ok(calls.every(url => !url.includes('/repos/PhyberApex/')))
  } finally {
    globalThis.fetch = original
  }
})

it('invalidates a timeline response when the fixing PR targets change', () => {
  const unit = fixtureUnit()
  unit.fixedBy = {
    repo: 'other/repo',
    number: 50,
    url: 'https://github.com/other/repo/pull/50',
    authorLogin: 'other',
    state: 'merged',
    closes: ['acme/app#4'],
  }
  const before = membersHash(unit)
  unit.fixedBy.closes.push('acme/app#9')
  assert.notEqual(membersHash(unit), before)
})

it('returns null when the card is not on the viewer board', async () => {
  const body = await assembleTimeline({
    token: 'token',
    login: 'octo-dev',
    unit: null,
    store: memoryStore(),
    nowMs: NOW,
    fresh: false,
  })
  assert.equal(body, null)
})

it('ignores pre-Markdown derived caches and retains complete bodies in the new response', async () => {
  const store = memoryStore()
  const unit = fixtureUnit()
  unit.fixedBy = null
  const member = unit.members[0]!
  const legacy = JSON.stringify([{ id: 'legacy', kind: 'comment', excerpt: '<summary>broken' }])
  store.data.set(
    `tlresp:v3:octo-dev:${unit.id}:${membersHash(unit)}`,
    JSON.stringify({ entries: [] }),
  )
  store.data.set(`events:v2:octo-dev:acme/app#12:${member.updatedAt}`, legacy)
  store.data.set(`revcomments:v1:octo-dev:acme/app#12:${member.updatedAt}`, legacy)
  const markdown =
    '<details><summary>Fresh report</summary><p>Full <strong>Markdown</strong> body.</p></details>'
  const original = globalThis.fetch
  globalThis.fetch = async input => {
    const url = String(input)
    if (url.includes('/issues/12/timeline'))
      return respond([
        {
          id: 'fresh-comment',
          event: 'commented',
          created_at: '2026-10-10T00:00:00Z',
          actor: { login: 'octo-dev', type: 'User' },
          body: markdown,
        },
      ])
    if (url.includes('/pulls/12/comments'))
      return respond([
        {
          id: 'fresh-inline',
          created_at: '2026-10-10T01:00:00Z',
          user: { login: 'reviewer', type: 'User' },
          body: markdown,
        },
      ])
    return respond(url.includes('/check-runs') ? { check_runs: [] } : [])
  }
  try {
    const body = await assembleTimeline({
      token: 'token',
      login: 'octo-dev',
      unit,
      store,
      nowMs: NOW,
      fresh: false,
    })
    assert.equal(body?.cached, false)
    for (const id of ['fresh-comment', 'fresh-inline']) {
      const entry: TimelinePayload['entries'][number] | undefined = body?.entries.find(
        event => event.id === id,
      )
      assert.ok(entry && 'body' in entry)
      assert.equal(entry.body, markdown)
      assert.equal(entry.excerpt, 'Fresh report Full Markdown body.')
    }
    assert.ok(!body?.entries.some(entry => entry.id === 'legacy'))
  } finally {
    globalThis.fetch = original
  }
})

it('skips the response cache when refresh=1', async () => {
  let calls = 0
  const original = globalThis.fetch
  globalThis.fetch = async () => {
    calls += 1
    return respond([])
  }
  const store = memoryStore()
  const unit = fixtureUnit()
  const key = `tlresp:v4:octo-dev:${unit.id}:${membersHash(unit)}`
  const sentinel: TimelinePayload = {
    id: unit.id,
    generatedAt: '2000-01-01T00:00:00.000Z',
    cached: false,
    entries: [],
    items: [],
    truncated: true,
  }
  store.data.set(key, JSON.stringify(sentinel))
  try {
    const cached = await assembleTimeline({
      token: 'token',
      login: 'octo-dev',
      unit,
      store,
      nowMs: NOW,
      fresh: false,
    })
    assert.equal(calls, 0)
    assert.equal(cached?.truncated, true)
    assert.equal(cached?.cached, true)

    const fresh = await assembleTimeline({
      token: 'token',
      login: 'octo-dev',
      unit,
      store,
      nowMs: NOW,
      fresh: true,
    })
    assert.ok(calls > 0)
    assert.equal(fresh?.cached, false)
    assert.equal(fresh?.truncated, false)
  } finally {
    globalThis.fetch = original
  }
})

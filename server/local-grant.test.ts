import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { issueLocalGrant, verifyLocalGrant } from './local-grant'

const input = {
  secret: 'test-session-secret',
  origin: 'https://osdash.froq.me',
  challenge: 'x'.repeat(32),
  nowMs: Date.parse('2026-10-26T00:00:00Z'),
  account: { id: '12345', login: 'octo-dev' },
}

it('attests only a stable GitHub account and binds the grant to origin and bridge challenge', async () => {
  const grant = await issueLocalGrant(input)
  assert.deepEqual(await verifyLocalGrant({ ...input, grant }), input.account)
  for (const override of [
    { secret: 'other' },
    { origin: 'https://evil.example' },
    { challenge: 'y'.repeat(32) },
    { nowMs: input.nowMs + 91_000 },
    { nowMs: input.nowMs - 1000 },
  ]) {
    await assert.rejects(verifyLocalGrant({ ...input, grant, ...override }))
  }
  await assert.rejects(verifyLocalGrant({ ...input, grant: `${grant}tampered` }))
})

it('rejects unvalidated identities and arbitrary path-like challenges', async () => {
  await assert.rejects(issueLocalGrant({ ...input, account: { id: '../123', login: 'octo-dev' } }))
  await assert.rejects(issueLocalGrant({ ...input, challenge: '../bad' }))
  await assert.rejects(issueLocalGrant({ ...input, secret: '' }))
})

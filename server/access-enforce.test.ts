import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import type { H3Event } from 'h3'
import { accessEnforced } from './bindings'

function eventWithEnv(vars: Record<string, string>): H3Event {
  return { context: { cloudflare: { env: vars } } } as unknown as H3Event
}

it('only enforces Cloudflare Access when OSDASH_ACCESS_ENFORCE is set', () => {
  assert.equal(accessEnforced(eventWithEnv({})), false)
  assert.equal(accessEnforced(eventWithEnv({ OSDASH_ACCESS_ENFORCE: 'false' })), false)
  assert.equal(accessEnforced(eventWithEnv({ OSDASH_ACCESS_ENFORCE: 'true' })), true)
  assert.equal(accessEnforced(eventWithEnv({ OSDASH_ACCESS_ENFORCE: '1' })), true)
})

import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { deviceSocketOrigin } from './device-relay'

it('keeps production sockets on their own origin and only accepts a loopback relay override locally', () => {
  assert.equal(
    deviceSocketOrigin('https://osdash.froq.me', 'http://127.0.0.1:9'),
    'https://osdash.froq.me',
  )
  assert.equal(
    deviceSocketOrigin('http://localhost:3000', 'http://127.0.0.1:9'),
    'http://127.0.0.1:9',
  )
  assert.throws(
    () => deviceSocketOrigin('http://localhost:3000', 'https://example.test'),
    /loopback|Invalid/,
  )
})

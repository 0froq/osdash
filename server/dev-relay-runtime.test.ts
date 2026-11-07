import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'vite-plus/test'
import { startDevRelay } from '../tooling/dev-relay'

it('provides real local namespace RPC and keeps local binding metadata across runtime restarts', async () => {
  const persistence = await mkdtemp(join(tmpdir(), 'osdash-local-relay-'))
  let relay = await startDevRelay({ persistence })
  const device = {
    id: randomUUID(),
    secret: randomBytes(32).toString('base64url'),
    name: 'Local Mini',
  }
  const account = { id: '123', login: 'octocat' }
  try {
    let stub = relay.namespace.getByName('local:123')
    assert.equal(await stub.status(), null)
    await stub.register(account, device)
    assert.equal((await stub.status())?.id, device.id)
    const protocol = `osdash-device-v1, auth.123.${device.id}.${device.secret}`
    assert.equal(
      (
        await fetch(relay.origin + '/api/device/socket', {
          headers: { 'Sec-WebSocket-Protocol': protocol },
        })
      ).status,
      204,
    )
    assert.equal((await fetch(relay.origin + '/api/device/socket')).status, 401)
    assert.equal(await relay.namespace.getByName('production:123').status(), null)
    await relay.close()
    relay = await startDevRelay({ persistence })
    stub = relay.namespace.getByName('local:123')
    assert.equal((await stub.status())?.id, device.id)
    assert.equal((await stub.status())?.online, false)
  } finally {
    await relay.close()
    await rm(persistence, { recursive: true, force: true })
  }
}, 30000)

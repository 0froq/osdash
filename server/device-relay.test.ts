import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rolldown } from 'rolldown'
import { Miniflare, type MiniflareOptions } from 'miniflare'
import { it } from 'vite-plus/test'
import { createDeviceClient } from '../local/device-client'
import { openWorkspace } from '../local/workspace'

async function until(predicate: () => Promise<boolean>) {
  for (let i = 0; i < 100; i++) {
    if (await predicate()) return
    await new Promise(resolve => setTimeout(resolve, 30))
  }
  throw new Error('Timed out waiting for device state')
}

it('relays account-scoped operations to actual files, rejects stale writes, reconnects and revokes without storing note bodies', async () => {
  const bundle = await rolldown({
    input: fileURLToPath(new URL('../relay/device-relay.ts', import.meta.url)),
    platform: 'neutral',
    external: ['cloudflare:workers'],
  })
  const output = await bundle.generate({ format: 'esm' })
  await bundle.close()
  const script = output.output.find(chunk => chunk.type === 'chunk')!
  assert.equal(script.type, 'chunk')
  const fixture = `
export class ProbeRelay extends DeviceRelay {
  async inspect() { return [...(await this.ctx.storage.list()).entries()] }
  pendingCount() { return this.pending.size }
  expire(operation) { this.ctx.getWebSockets()[0].send(JSON.stringify({...operation,id:crypto.randomUUID(),type:'request',expiresAt:Date.now()-1000})) }
}
export default { async fetch(request, env) {
  const upgrade = socketUpgrade(request, env); if (upgrade) return upgrade;
  const url = new URL(request.url);
  const account = url.searchParams.get('account') || '123';
  const stub = env.DEVICE_RELAY.getByName('production:' + account);
  try {
    if (url.pathname === '/api/device/register') {
      const body = await request.json();
      if (body.grant !== 'test-grant') return new Response('', {status:403});
      return Response.json({device:await stub.register({id:account,login:'octocat'},body)});
    }
    if (url.pathname === '/status') return Response.json(await stub.status());
    if (url.pathname === '/inspect') return Response.json(await stub.inspect());
    if (url.pathname === '/pending') return Response.json(await stub.pendingCount());
    if (url.pathname === '/expired') { await stub.expire(await request.json()); return Response.json({ok:true}) }
    if (url.pathname === '/request') return Response.json(await stub.request(await request.json()));
    if (url.pathname === '/revoke') { await stub.revoke((await request.json()).id); return Response.json({ok:true}) }
    return new Response('',{status:404});
  } catch(error) { return Response.json({error:error.message},{status:409}) }
} }
`
  const mf = new Miniflare({
    workers: [
      {
        config: {
          name: 'relay-test',
          compatibilityDate: '2026-10-19',
          manifest: {
            mainModule: 'worker.mjs',
            modules: { 'worker.mjs': { type: 'esm', contents: script.code + fixture } },
          },
          env: {
            DEVICE_RELAY: {
              type: 'durable-object',
              worker: 'relay-test',
              exportName: 'ProbeRelay',
            },
          },
          exports: { ProbeRelay: { type: 'durable-object', storage: 'sqlite' } },
        },
      },
    ],
  } satisfies MiniflareOptions)
  const root = await mkdtemp(join(tmpdir(), 'osdash-remote-notes-'))
  let client: ReturnType<typeof createDeviceClient> | undefined
  try {
    const url = await mf.ready
    const origin = url.origin
    const workspace = await openWorkspace(root, origin)
    const call = async (path: string, value?: unknown) => {
      const response = await fetch(
        origin + path,
        value === undefined
          ? {}
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(value),
            },
      )
      return { status: response.status, body: (await response.json()) as Record<string, any> }
    }
    assert.equal((await call('/status')).body, null)
    assert.equal(
      (await call('/request', { action: 'list', unit: 'pr:owner/repo#42' })).body.status,
      503,
    )
    client = createDeviceClient(workspace, origin, 'Mini', () => {})
    await client.bind({ id: '123', login: 'octocat' }, 'test-grant', 'x'.repeat(32))
    await until(async () => Boolean((await call('/status')).body?.online))
    const credential = await workspace.readDevice()
    assert.ok(credential)
    const unit = 'pr:owner/repo#42'
    const note = {
      id: 'a1234567-1234-4567-89ab-123456789abc',
      text: '# Private remote note',
      anchor: new Date().toISOString(),
      at: new Date().toISOString(),
    }
    const first = (await call('/request', { action: 'save', unit, note, version: null })).body
    assert.equal(first.status, 200)
    assert.deepEqual(first.body.note, note)
    const path = join(root, '.os/users/123/notes/owner/repo/pr-42', `${note.id}.md`)
    assert.ok((await readFile(path, 'utf8')).endsWith(note.text))
    assert.equal((await call('/request?account=456', { action: 'list', unit })).body.status, 503)
    const snapshot = (await call('/request', { action: 'list', unit })).body
    assert.equal(snapshot.body.versions[note.id], first.body.version)
    const changed = { ...note, text: 'Changed from Air', anchor: '2026-10-27T00:00:00.000Z' }
    const second = (
      await call('/request', { action: 'save', unit, note: changed, version: first.body.version })
    ).body
    assert.equal(second.status, 200)
    const stale = (
      await call('/request', { action: 'save', unit, note, version: first.body.version })
    ).body
    assert.equal(stale.status, 409)
    assert.ok((await readFile(path, 'utf8')).endsWith(changed.text))
    assert.equal(
      (
        await call('/request', {
          action: 'delete',
          unit,
          noteId: note.id,
          version: first.body.version,
        })
      ).body.status,
      409,
    )
    const originalSnapshot = workspace.snapshot
    let release: () => void = () => {}
    const hold = new Promise<void>(resolve => {
      release = resolve
    })
    workspace.snapshot = async (...args) => {
      await hold
      return originalSnapshot(...args)
    }
    const concurrent = Array.from({ length: 16 }, () => call('/request', { action: 'list', unit }))
    try {
      await until(async () => Number((await call('/pending')).body) === 16)
      assert.equal((await call('/request', { action: 'list', unit })).body.status, 429)
    } finally {
      release()
      workspace.snapshot = originalSnapshot
    }
    assert.ok((await Promise.all(concurrent)).every(result => result.body.status === 200))
    await call('/expired', { action: 'save', unit, note, version: second.body.version })
    await until(async () => !(await call('/status')).body.online)
    assert.ok((await readFile(path, 'utf8')).endsWith(changed.text))
    await until(async () => Boolean((await call('/status')).body.online))
    const stored = JSON.stringify((await call('/inspect')).body)
    assert.ok(
      !stored.includes(note.text) &&
        !stored.includes(changed.text) &&
        !stored.includes(credential.secret),
    )
    assert.equal(
      (
        await call('/api/device/register', {
          ...credential,
          id: 'b1234567-1234-4567-89ab-123456789abc',
          grant: 'test-grant',
        })
      ).status,
      409,
    )
    client.stop()
    await until(async () => !(await call('/status')).body.online)
    assert.equal((await call('/request', { action: 'list', unit })).body.status, 503)
    client = createDeviceClient(workspace, origin, 'Mini', () => {})
    await client.start()
    await until(async () => Boolean((await call('/status')).body.online))
    const removed = (
      await call('/request', {
        action: 'delete',
        unit,
        noteId: note.id,
        version: second.body.version,
      })
    ).body
    assert.equal(removed.status, 200)
    await assert.rejects(
      readFile(path),
      (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT',
    )
    await call('/revoke', { id: credential.id })
    await until(async () => (await call('/status')).body === null)
    const denied = await fetch(origin + '/api/device/socket', {
      headers: {
        'Sec-WebSocket-Protocol': `osdash-device-v1, auth.123.${credential.id}.${credential.secret}`,
      },
    })
    assert.equal(denied.status, 401)
    assert.equal(
      (await call('/request', { action: 'save', unit, note, version: null })).body.status,
      503,
    )
    await assert.rejects(
      readFile(path),
      (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT',
    )
  } finally {
    client?.stop()
    await mf.dispose()
    await rm(root, { recursive: true, force: true })
  }
}, 30_000)

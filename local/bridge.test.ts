import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { request } from 'node:http'
import { it } from 'vite-plus/test'
import { createLocalBridge, readLocalConfig, safeLocalConfig } from './bridge'
import { LOCAL_BRIDGE_ORIGIN, LOCAL_BRIDGE_PROTOCOL } from '../shared/local-bridge'
import { openWorkspace } from './workspace'

async function withBridge(
  run: (client: {
    code: string
    expiresAt: number
    advance: (ms: number) => void
    call: (path: string, init?: RequestInit) => Promise<Response>
    hostCall: (host: string) => Promise<number>
  }) => Promise<void>,
  options: Partial<Parameters<typeof createLocalBridge>[0]> = {},
) {
  let now = Date.now()
  const bridge = createLocalBridge({
    readConfig: async () =>
      safeLocalConfig({ locale: 'zh-CN', notesDirectory: '/private/notes', apiKey: 'secret' }),
    now: () => now,
    ...options,
  })
  await new Promise<void>(resolve => bridge.server.listen(0, '127.0.0.1', resolve))
  const address = bridge.server.address()
  assert.ok(address && typeof address !== 'string')
  const base = `http://127.0.0.1:${address.port}`
  try {
    await run({
      code: bridge.pairingCode,
      expiresAt: bridge.pairingExpiresAt,
      advance: ms => {
        now += ms
      },
      call: (path, init = {}) =>
        fetch(`${base}${path}`, {
          ...init,
          headers: { Origin: LOCAL_BRIDGE_ORIGIN, ...init.headers },
        }),
      hostCall: host =>
        new Promise((resolve, reject) => {
          const req = request(
            `${base}/v1/status`,
            { headers: { Host: host, Origin: LOCAL_BRIDGE_ORIGIN } },
            res => {
              res.resume()
              resolve(res.statusCode!)
            },
          )
          req.on('error', reject)
          req.end()
        }),
    })
  } finally {
    bridge.server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      bridge.server.close(error => (error ? reject(error) : resolve())),
    )
  }
}

function pair(code: string): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  }
}

it('serves coarse status without config and disallows untrusted or absent origins and rebinding hosts', async () => {
  await withBridge(async client => {
    const status = await client.call('/v1/status')
    const body = (await status.json()) as {
      protocol: number
      capabilities: string[]
      challenge: string
    }
    assert.equal(body.protocol, LOCAL_BRIDGE_PROTOCOL)
    assert.deepEqual(body.capabilities, ['config:read'])
    assert.match(body.challenge, /^[A-Za-z0-9_-]{32}$/)
    assert.equal(status.headers.get('cache-control'), 'no-store')
    assert.equal(status.headers.get('access-control-allow-origin'), LOCAL_BRIDGE_ORIGIN)
    for (const origin of ['', 'https://evil.example', 'https://osdash.froq.me.evil.example']) {
      const denied = await client.call('/v1/status', { headers: { Origin: origin } })
      assert.equal(denied.status, 403)
      assert.equal(denied.headers.get('access-control-allow-origin'), null)
    }
    assert.equal(await client.hostCall('evil.example'), 403)
    assert.equal((await client.call('/v1/config')).status, 401)
  })
})

it('pairs once, exposes only safe config, and revokes the token', async () => {
  await withBridge(async client => {
    const paired = await client.call('/v1/pair', pair(client.code))
    assert.equal(paired.status, 200)
    const body = (await paired.json()) as { token: string; expiresAt: string }
    assert.ok(body.token.length >= 40)
    assert.ok(Date.parse(body.expiresAt) > client.expiresAt)
    const headers = { Authorization: `Bearer ${body.token}` }
    assert.equal(
      (await client.call('/v1/config', { headers: { Authorization: body.token } })).status,
      401,
    )
    assert.equal((await client.call('/v1/pair', pair(client.code))).status, 410)
    assert.deepEqual(await (await client.call('/v1/config', { headers })).json(), {
      locale: 'zh-CN',
      notesConfigured: true,
    })
    assert.equal(
      (await client.call('/v1/config', { headers: { ...headers, Origin: 'https://evil.example' } }))
        .status,
      403,
    )
    assert.equal((await client.call('/v1/pair', { method: 'DELETE', headers })).status, 204)
    assert.equal((await client.call('/v1/config', { headers })).status, 401)
  })
})

it('rejects expired pairing codes and access tokens', async () => {
  await withBridge(async client => {
    client.advance(5 * 60 * 1000)
    assert.equal((await client.call('/v1/pair', pair(client.code))).status, 410)
  })
  await withBridge(async client => {
    const { token } = (await (await client.call('/v1/pair', pair(client.code))).json()) as {
      token: string
    }
    client.advance(8 * 60 * 60 * 1000)
    assert.equal(
      (await client.call('/v1/config', { headers: { Authorization: `Bearer ${token}` } })).status,
      401,
    )
  })
})

it('locks pairing after five wrong attempts', async () => {
  await withBridge(async client => {
    for (let n = 0; n < 5; n++)
      assert.equal((await client.call('/v1/pair', pair('wrong'))).status, 403)
    assert.equal((await client.call('/v1/pair', pair(client.code))).status, 429)
  })
})

it('does not allow concurrent replay of the pairing code', async () => {
  await withBridge(async client => {
    const responses = await Promise.all([
      client.call('/v1/pair', pair(client.code)),
      client.call('/v1/pair', pair(client.code)),
    ])
    assert.deepEqual(responses.map(response => response.status).sort(), [200, 410])
  })
})

it('bounds JSON bodies and refuses invalid content without consuming the code', async () => {
  await withBridge(async client => {
    assert.equal((await client.call('/v1/pair', { method: 'POST', body: 'x' })).status, 415)
    assert.equal((await client.call('/v1/pair', { ...pair('x'), body: '{' })).status, 400)
    assert.equal((await client.call('/v1/pair', pair('x'.repeat(4096)))).status, 413)
    assert.equal((await client.call('/v1/pair', pair(client.code))).status, 200)
  })
})

it('accepts only approved preflight methods and headers', async () => {
  await withBridge(async client => {
    const response = await client.call('/v1/config', {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
        'Access-Control-Request-Private-Network': 'true',
      },
    })
    assert.equal(response.status, 204)
    assert.equal(response.headers.get('access-control-allow-private-network'), 'true')
    assert.equal(
      (
        await client.call('/v1/config', {
          method: 'OPTIONS',
          headers: { 'Access-Control-Request-Method': 'PUT' },
        })
      ).status,
      403,
    )
    assert.equal(
      (
        await client.call('/v1/config', {
          method: 'OPTIONS',
          headers: {
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'x-arbitrary',
          },
        })
      ).status,
      403,
    )
  })
})

it('supports an explicit development origin but rejects non-loopback HTTP and path origins', () => {
  const bridge = createLocalBridge({
    origin: 'http://localhost:3950',
    readConfig: async () => safeLocalConfig({}),
  })
  bridge.server.close()
  for (const origin of [
    'http://evil.example',
    'https://osdash.froq.me/',
    'https://osdash.froq.me/path',
    'null',
  ]) {
    assert.throws(() => createLocalBridge({ origin, readConfig: async () => safeLocalConfig({}) }))
  }
})

it('reads bounded config without creating it or exposing unknown fields', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'osdash-bridge-'))
  const path = join(directory, 'config.json')
  try {
    assert.deepEqual(await readLocalConfig(path), { locale: 'system', notesConfigured: false })
    await writeFile(
      path,
      JSON.stringify({
        locale: 'en',
        notesDirectory: '/secret/path',
        token: 'secret',
        extra: 'private',
      }),
    )
    assert.deepEqual(await readLocalConfig(path), { locale: 'en', notesConfigured: true })
    await writeFile(path, '{')
    await assert.rejects(readLocalConfig(path))
    await writeFile(path, ' '.repeat(65537))
    await assert.rejects(readLocalConfig(path))
    assert.throws(() => safeLocalConfig({ locale: 'unknown' }))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

it('requires an attested account for note CRUD and ignores client-supplied account directories', async () => {
  const root = await mkdtemp(join(tmpdir(), 'osdash-bound-bridge-'))
  try {
    const workspace = await openWorkspace(root, LOCAL_BRIDGE_ORIGIN)
    const unit = 'pr:owner/repo#42'
    const note = {
      id: 'a1234567-1234-4567-89ab-123456789abc',
      text: '**Local**',
      at: new Date().toISOString(),
      anchor: new Date().toISOString(),
    }
    for (const id of ['123', '456']) {
      const account = { id, login: `user-${id}` }
      await withBridge(
        async client => {
          const status = (await (await client.call('/v1/status')).json()) as {
            capabilities: string[]
          }
          assert.ok(status.capabilities.includes('notes:write'))
          assert.equal(
            (await client.call('/v1/notes?unit=' + encodeURIComponent(unit))).status,
            401,
          )
          const bad = {
            ...pair(client.code),
            body: JSON.stringify({ code: client.code, grant: 'forged', account }),
          }
          assert.equal((await client.call('/v1/pair', bad)).status, 403)
          const paired = await client.call('/v1/pair', {
            ...pair(client.code),
            body: JSON.stringify({ code: client.code, grant: 'valid' }),
          })
          assert.equal(paired.status, 200)
          const credential = (await paired.json()) as { token: string; account: unknown }
          assert.deepEqual(credential.account, account)
          const headers = { Authorization: `Bearer ${credential.token}` }
          const query = `/v1/notes?${new URLSearchParams({ unit })}`
          assert.deepEqual(await (await client.call(query, { headers })).json(), { notes: [] })
          const saved = await client.call('/v1/notes', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ unit, note, account: { id: '999' } }),
          })
          assert.equal(saved.status, 200)
          assert.deepEqual(await saved.json(), { note })
          assert.deepEqual(await workspace.list({ id: '999', login: 'spoofed' }, unit), [])
          assert.equal(
            (await client.call('/v1/notes?unit=pr:owner/..%2342', { headers })).status,
            400,
          )
          assert.deepEqual(await (await client.call(query, { headers })).json(), { notes: [note] })
          assert.equal(
            (await client.call(`${query}&id=${note.id}`, { method: 'DELETE', headers })).status,
            200,
          )
          assert.deepEqual(await workspace.list(account, unit), [])
          assert.equal((await client.call('/v1/pair', { method: 'DELETE', headers })).status, 204)
          assert.equal((await client.call(query, { headers })).status, 401)
        },
        {
          workspace,
          readConfig: workspace.readConfig,
          verifyAccount: async grant => {
            if (grant !== 'valid') throw new Error('Invalid grant')
            return account
          },
        },
      )
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

it('rechecks pairing expiry after asynchronous identity verification', async () => {
  const root = await mkdtemp(join(tmpdir(), 'osdash-expiring-bridge-'))
  try {
    const workspace = await openWorkspace(root, LOCAL_BRIDGE_ORIGIN)
    let started!: () => void
    let finish!: () => void
    const verifying = new Promise<void>(resolve => {
      started = resolve
    })
    const release = new Promise<void>(resolve => {
      finish = resolve
    })
    await withBridge(
      async client => {
        const pending = client.call('/v1/pair', {
          ...pair(client.code),
          body: JSON.stringify({ code: client.code, grant: 'valid' }),
        })
        await verifying
        assert.equal((await client.call('/v1/pair', pair(client.code))).status, 410)
        client.advance(5 * 60 * 1000)
        finish()
        assert.equal((await pending).status, 410)
        assert.equal((await client.call('/v1/config')).status, 401)
      },
      {
        workspace,
        verifyAccount: async () => {
          started()
          await release
          return { id: '123', login: 'octocat' }
        },
      },
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

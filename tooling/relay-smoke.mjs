import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Miniflare } from 'miniflare'
import { SignJWT } from 'jose'
import { LOCAL_BRIDGE_ORIGIN, LOCAL_BRIDGE_PROTOCOL } from '../shared/local-bridge.ts'

const modules = {}
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await collect(path, `${name}/`)
    else if (/\.(mjs|js|json)$/.test(name)) {
      modules[name] = {
        type: name.endsWith('.json') ? 'json' : 'esm',
        contents: await readFile(path, 'utf8'),
      }
    }
  }
}
await collect('.output/server')
const sessionSecret = 'local-build-smoke-session-secret'
const runtime = new Miniflare({
  workers: [
    {
      config: {
        name: 'osdash-build-smoke',
        compatibilityDate: '2026-10-19',
        compatibilityFlags: ['nodejs_compat', 'nodejs_als'],
        manifest: { mainModule: 'index.mjs', modules },
        env: {
          SESSION_SECRET: { type: 'text', value: sessionSecret },
          DEVICE_RELAY: {
            type: 'durable-object',
            worker: 'osdash-build-smoke',
            exportName: 'DeviceRelay',
          },
        },
        exports: { DeviceRelay: { type: 'durable-object', storage: 'sqlite' } },
      },
    },
  ],
})
try {
  const origin = (await runtime.ready).origin
  for (const [path, expected] of [
    ['/login', 200],
    ['/api/device/status', 401],
    ['/api/device/socket', 401],
  ]) {
    const response = await fetch(origin + path, { redirect: 'manual' })
    assert.equal(response.status, expected, path)
    await response.arrayBuffer()
    console.log(`Built Worker ${path}: ${response.status}`)
  }
  const challenge = 'x'.repeat(32)
  const key = new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`osdash-local-grant:v1\0${sessionSecret}`),
    ),
  )
  const now = Math.floor(Date.now() / 1000)
  const grant = await new SignJWT({ login: 'fixture', challenge, purpose: 'device:bind' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject('424242')
    .setIssuer(origin)
    .setAudience('osdash-local-bridge')
    .setIssuedAt(now)
    .setExpirationTime(now + 90)
    .sign(key)
  const enrollment = {
    grant,
    challenge,
    id: 'a1234567-1234-4567-89ab-123456789abc',
    secret: 'a'.repeat(43),
    name: 'Fixture Mini',
  }
  const register = body =>
    fetch(`${origin}/api/device/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  const registered = await register(enrollment)
  assert.equal(registered.status, 200, await registered.text())
  assert.equal((await register(enrollment)).status, 200)
  assert.equal((await register({ ...enrollment, grant: 'invalid' })).status, 403)
  assert.equal((await register({ ...enrollment, padding: 'x'.repeat(90_000) })).status, 413)
  assert.equal(
    (await register({ ...enrollment, id: 'b1234567-1234-4567-89ab-123456789abc' })).status,
    409,
  )
  const probe = await fetch(`${origin}/api/device/socket`, {
    headers: {
      'Sec-WebSocket-Protocol': `osdash-device-v1, auth.424242.${enrollment.id}.${enrollment.secret}`,
    },
  })
  assert.equal(probe.status, 204)
  console.log(
    'Built Worker registration, idempotent retry, invalid grant, size bound, device conflict and socket authentication: passed',
  )
} finally {
  await runtime.dispose()
}

const program = 'public/downloads/os-bridge.mjs'
assert.ok(
  execFileSync(process.execPath, [program, '--help'], { encoding: 'utf8' }).includes('--name'),
)
const expectedHash = (await readFile(`${program}.sha256`, 'utf8')).trim().split(/\s+/)[0]
assert.equal(
  createHash('sha256')
    .update(await readFile(program))
    .digest('hex'),
  expectedHash,
)
const reserve = createServer()
reserve.listen(0, '127.0.0.1')
await once(reserve, 'listening')
const port = reserve.address().port
await new Promise(resolve => reserve.close(resolve))
const root = await mkdtemp(join(tmpdir(), 'osdash-bundled-cli-'))
const child = spawn(
  process.execPath,
  [program, 'serve', '--foreground', '--root', root, '--port', String(port), '--name', 'Mini'],
  { stdio: 'ignore' },
)
try {
  let response
  for (let attempt = 0; attempt < 100; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 30))
    try {
      response = await fetch(`http://127.0.0.1:${port}/v1/status`, {
        headers: { Origin: LOCAL_BRIDGE_ORIGIN },
      })
      break
    } catch {
      /* Wait for this temporary CLI process to listen. */
    }
  }
  assert.equal(response?.status, 200)
  assert.equal((await response.json()).protocol, LOCAL_BRIDGE_PROTOCOL)
  assert.equal(
    JSON.parse(await readFile(join(root, '.os/config.json'), 'utf8')).origin,
    LOCAL_BRIDGE_ORIGIN,
  )
  console.log(`Built CLI: help, checksum, startup and protocol ${LOCAL_BRIDGE_PROTOCOL} passed`)
} finally {
  if (child.exitCode === null && child.signalCode === null) {
    const stopped = once(child, 'exit')
    child.kill('SIGTERM')
    await stopped
  }
  await rm(root, { recursive: true, force: true })
}

import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import type { RelayNamespace } from '../../shared/device-relay.ts'

function proxyNamespace(control: string): RelayNamespace {
  const call = async (name: string, method: string, args: unknown[]) => {
    const response = await fetch(`${control}/rpc`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, method, args }),
      signal: AbortSignal.timeout(30_000),
    })
    const body = (await response.json()) as { result?: unknown; error?: string }
    if (!response.ok) throw new Error(body.error || 'Local relay call failed')
    return body.result
  }
  return {
    getByName(name) {
      const stub: ReturnType<RelayNamespace['getByName']> = {
        register: (account, device) =>
          call(name, 'register', [account, device]) as ReturnType<typeof stub.register>,
        status: () => call(name, 'status', []) as ReturnType<typeof stub.status>,
        revoke: id => call(name, 'revoke', [id]) as ReturnType<typeof stub.revoke>,
        request: operation => call(name, 'request', [operation]) as ReturnType<typeof stub.request>,
      }
      return stub
    },
  }
}

export default defineNitroPlugin(async nitro => {
  const script = fileURLToPath(new URL('../../tooling/dev-relay-serve.ts', import.meta.url))
  const child = spawn(process.execPath, ['--experimental-strip-types', script], {
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  const ready = await new Promise<string>((resolve, reject) => {
    const lines = createInterface({ input: child.stdout! })
    lines.once('line', resolve)
    child.once('exit', code => reject(new Error(`Local relay exited (${code ?? 'signal'})`)))
  })
  let info: { origin?: unknown; control?: unknown }
  try {
    const parsed: unknown = JSON.parse(ready)
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid relay address')
    info = parsed
  } catch {
    child.kill('SIGTERM')
    throw new Error('Local relay did not report its address')
  }
  if (typeof info.origin !== 'string' || typeof info.control !== 'string')
    throw new Error('Local relay did not report its address')
  const namespace = proxyNamespace(info.control)
  nitro.hooks.hook('request', event => {
    event.context.cloudflare = {
      ...event.context.cloudflare,
      env: {
        ...event.context.cloudflare?.env,
        DEVICE_RELAY: namespace,
        DEVICE_RELAY_SCOPE: 'local',
        DEVICE_RELAY_LOCAL_ORIGIN: info.origin as string,
      },
    }
  })
  nitro.hooks.hook('close', () => {
    child.kill('SIGTERM')
  })
})

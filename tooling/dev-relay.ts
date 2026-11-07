import { resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { rolldown } from 'rolldown'
import { Miniflare, type MiniflareOptions } from 'miniflare'
import type { RelayNamespace } from '../shared/device-relay'

/** Real native relay, with its own namespace and storage, for Nuxt development only. */
export async function startDevRelay(options: { root?: string; persistence?: string } = {}) {
  const bundle = await rolldown({
    input: resolve(options.root ?? process.cwd(), 'relay/device-relay.ts'),
    platform: 'neutral',
    external: ['cloudflare:workers'],
  })
  let code: string
  try {
    const output = await bundle.generate({ format: 'esm' })
    code = output.output.find(chunk => chunk.type === 'chunk')!.code
  } finally {
    await bundle.close()
  }
  if (options.persistence) await mkdir(options.persistence, { recursive: true, mode: 0o700 })
  const runtime = new Miniflare({
    host: '127.0.0.1',
    port: 0,
    ...(options.persistence ? { resourcePersistencePath: options.persistence } : {}),
    workers: [
      {
        config: {
          name: 'osdash-local-relay',
          compatibilityDate: '2026-10-19',
          manifest: {
            mainModule: 'worker.mjs',
            modules: {
              'worker.mjs': {
                type: 'esm',
                contents: `${code}\nexport default { fetch(request, env) { return socketUpgrade(request, env) || new Response(null, { status: 404 }) } }`,
              },
            },
          },
          env: {
            DEVICE_RELAY: {
              type: 'durable-object',
              worker: 'osdash-local-relay',
              exportName: 'DeviceRelay',
            },
            DEVICE_RELAY_SCOPE: { type: 'text', value: 'local' },
          },
          exports: { DeviceRelay: { type: 'durable-object', storage: 'sqlite' } },
        },
      },
    ],
  } satisfies MiniflareOptions)
  try {
    const url = await runtime.ready
    const bindings = await runtime.getBindings<{ DEVICE_RELAY: RelayNamespace }>()
    return { origin: url.origin, namespace: bindings.DEVICE_RELAY, close: () => runtime.dispose() }
  } catch (error) {
    await runtime.dispose()
    throw error
  }
}

import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { startDevRelay } from './dev-relay.ts'

const relay = await startDevRelay({ persistence: resolve('.cache/osdash/local-relay') })
const control = createServer(async (req, res) => {
  if (req.url !== '/rpc' || req.method !== 'POST') {
    res.writeHead(404)
    res.end()
    return
  }
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString()) as {
      name?: unknown
      method?: unknown
      args?: unknown
    }
    if (
      typeof body.name !== 'string' ||
      typeof body.method !== 'string' ||
      !Array.isArray(body.args)
    )
      throw new Error('Invalid relay call')
    const stub = relay.namespace.getByName(body.name)
    const result = await (body.method === 'register'
      ? stub.register(body.args[0] as never, body.args[1] as never)
      : body.method === 'status'
        ? stub.status()
        : body.method === 'revoke'
          ? stub.revoke(String(body.args[0]))
          : body.method === 'request'
            ? stub.request(body.args[0] as never)
            : Promise.reject(new Error('Relay method denied')))
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ result }))
  } catch (error) {
    res.writeHead(400, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Relay call failed' }))
  }
})
await new Promise<void>(resolveListen => control.listen(0, '127.0.0.1', resolveListen))
const address = control.address()
if (!address || typeof address === 'string') throw new Error('Relay control port unavailable')
console.log(JSON.stringify({ origin: relay.origin, control: `http://127.0.0.1:${address.port}` }))
const stop = async () => {
  control.close()
  await relay.close()
  process.exit(0)
}
process.once('SIGTERM', () => void stop())
process.once('SIGINT', () => void stop())

import { DurableObject } from 'cloudflare:workers'
import { isLocalAccount, isLocalNoteId, type LocalAccount } from '../shared/local-bridge.ts'
import {
  DEVICE_PROTOCOL,
  DEVICE_TIMEOUT_MS,
  MAX_RELAY_BYTES,
  parseNoteOperation,
  socketCredential,
  validSecret,
  type DeviceInfo,
  type NoteOperation,
  type RelayResponse,
} from '../shared/device-relay.ts'

type Binding = {
  account: LocalAccount
  id: string
  name: string
  hash: string
  pairedAt: string
  revision: string
}
type Pending = {
  socket: WebSocket
  action: string
  finish: (value: RelayResponse) => void
  timer: ReturnType<typeof setTimeout>
}
const encoder = new TextEncoder()
async function hash(secret: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret))
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('')
}
function equal(a: string, b: string) {
  if (a.length !== b.length) return false
  let difference = 0
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return difference === 0
}

export class DeviceRelay extends DurableObject {
  private binding: Binding | null = null
  private pending = new Map<string, Pending>()
  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      this.binding = (await ctx.storage.get<Binding>('binding')) ?? null
    })
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
  }
  private sockets() {
    return this.ctx.getWebSockets().filter(socket => socket.readyState === 1)
  }
  async status(): Promise<DeviceInfo | null> {
    if (!this.binding) return null
    const { id, name, pairedAt, revision } = this.binding
    return { id, name, pairedAt, revision, online: this.sockets().length > 0 }
  }
  async register(
    account: LocalAccount,
    device: { id: string; secret: string; name: string },
  ): Promise<DeviceInfo> {
    if (
      !isLocalAccount(account) ||
      !isLocalNoteId(device.id) ||
      !validSecret(device.secret) ||
      !device.name?.trim() ||
      device.name.length > 64
    )
      throw new Error('INVALID_DEVICE')
    const secretHash = await hash(device.secret)
    if (this.binding) {
      if (
        this.binding.account.id !== account.id ||
        this.binding.id !== device.id ||
        !equal(this.binding.hash, secretHash)
      )
        throw new Error('DEVICE_ALREADY_BOUND')
      return (await this.status())!
    }
    const binding: Binding = {
      account,
      id: device.id,
      name: device.name.trim(),
      hash: secretHash,
      pairedAt: new Date().toISOString(),
      revision: crypto.randomUUID(),
    }
    await this.ctx.storage.put('binding', binding)
    this.binding = binding
    return (await this.status())!
  }
  async revoke(id: string): Promise<void> {
    if (!this.binding) return
    if (this.binding.id !== id) throw new Error('DEVICE_CHANGED')
    await this.ctx.storage.delete('binding')
    this.binding = null
    for (const socket of this.ctx.getWebSockets()) {
      this.fail(socket)
      socket.close(1008, 'Device unlinked')
    }
  }
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return new Response('Not found', { status: 404 })
    const auth = socketCredential(request.headers.get('sec-websocket-protocol'))
    const binding = this.binding
    if (
      !binding ||
      !auth ||
      auth.accountId !== binding.account.id ||
      auth.id !== binding.id ||
      !equal(await hash(auth.secret), binding.hash) ||
      this.binding !== binding
    ) {
      return new Response('Device authorization required', { status: 401 })
    }
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket')
      return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
    for (const previous of this.ctx.getWebSockets()) {
      this.fail(previous)
      previous.close(1008, 'Connection replaced')
    }
    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket]
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment({ deviceId: binding.id })
    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: { 'Sec-WebSocket-Protocol': DEVICE_PROTOCOL },
    })
  }
  async request(input: NoteOperation): Promise<RelayResponse> {
    const operation = parseNoteOperation(input)
    const socket = this.sockets()[0]
    if (!this.binding || !socket)
      return { status: 503, body: { error: 'Storage device is offline' } }
    if (this.pending.size >= 16) return { status: 429, body: { error: 'Storage device is busy' } }
    const id = crypto.randomUUID()
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        resolve({
          status: 504,
          body: { error: 'Storage device did not confirm the operation. Reload before retrying.' },
        })
      }, DEVICE_TIMEOUT_MS)
      this.pending.set(id, { socket, action: operation.action, finish: resolve, timer })
      try {
        socket.send(
          JSON.stringify({
            ...operation,
            id,
            type: 'request',
            expiresAt: Date.now() + DEVICE_TIMEOUT_MS,
          }),
        )
      } catch {
        this.fail(socket)
      }
    })
  }
  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string' || encoder.encode(message).length > MAX_RELAY_BYTES) {
      this.fail(socket)
      socket.close(1009, 'Invalid message')
      return
    }
    let result: { type?: unknown; id?: unknown; status?: unknown; body?: unknown }
    try {
      result = JSON.parse(message)
    } catch {
      this.fail(socket)
      socket.close(1003, 'Invalid JSON')
      return
    }
    if (!result || result.type !== 'result' || typeof result.id !== 'string') return
    const pending = this.pending.get(result.id)
    if (!pending || pending.socket !== socket || !this.binding) return
    if (typeof result.status !== 'number' || ![200, 400, 409, 500].includes(result.status)) {
      this.fail(socket)
      socket.close(1003, 'Invalid result')
      return
    }
    if (result.status === 200 && pending.action !== 'list') {
      const binding = { ...this.binding, revision: crypto.randomUUID() }
      await this.ctx.storage.put('binding', binding)
      this.binding = binding
    }
    clearTimeout(pending.timer)
    this.pending.delete(result.id)
    pending.finish({ status: Number(result.status), body: result.body ?? null })
  }
  private fail(socket: WebSocket) {
    for (const [id, pending] of this.pending) {
      if (pending.socket !== socket) continue
      clearTimeout(pending.timer)
      this.pending.delete(id)
      pending.finish({
        status: 503,
        body: { error: 'Storage device disconnected. Reload before retrying.' },
      })
    }
  }
  webSocketClose(socket: WebSocket) {
    this.fail(socket)
    socket.close(1000, 'Connection closed')
  }
  webSocketError(socket: WebSocket) {
    this.fail(socket)
    socket.close(1011, 'Connection failed')
  }
}

export function socketUpgrade(
  request: Request,
  env: { DEVICE_RELAY?: DurableObjectNamespace<DeviceRelay>; DEVICE_RELAY_SCOPE?: string },
): Promise<Response> | undefined {
  let path: string
  try {
    path = new URL(request.url).pathname
  } catch {
    return Promise.resolve(new Response('Invalid URL', { status: 400 }))
  }
  if (path !== '/api/device/socket') return
  const auth = socketCredential(request.headers.get('sec-websocket-protocol'))
  if (!auth || !env.DEVICE_RELAY)
    return Promise.resolve(
      new Response('Device authorization required', { status: env.DEVICE_RELAY ? 401 : 503 }),
    )
  return env.DEVICE_RELAY.getByName(
    `${env.DEVICE_RELAY_SCOPE ?? 'production'}:${auth.accountId}`,
  ).fetch(request)
}

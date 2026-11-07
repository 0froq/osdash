import { randomBytes, randomUUID } from 'node:crypto'
import type { LocalAccount } from '../shared/local-bridge.ts'
import {
  DEVICE_PROTOCOL,
  LOCAL_RELAY_HEADER,
  deviceSocketOrigin,
  MAX_RELAY_BYTES,
  parseNoteOperation,
  type DeviceCredential,
  type DeviceResult,
} from '../shared/device-relay.ts'
import { NoteConflict, type LocalWorkspace } from './workspace.ts'

export async function runDeviceCommand(
  workspace: LocalWorkspace,
  account: LocalAccount,
  input: unknown,
): Promise<{ status: number; body: unknown }> {
  try {
    const operation = parseNoteOperation(input)
    await workspace.readConfig()
    if (operation.action === 'catalog')
      return { status: 200, body: await workspace.catalog(account, operation.after) }
    if (operation.action === 'list')
      return { status: 200, body: await workspace.snapshot(account, operation.unit) }
    if (operation.action === 'save')
      return {
        status: 200,
        body: await workspace.saveVersioned(
          account,
          operation.unit,
          operation.note,
          operation.version,
        ),
      }
    await workspace.remove(
      account,
      operation.unit,
      operation.noteId,
      operation.version,
      operation.source,
    )
    return { status: 200, body: { ok: true } }
  } catch (error) {
    return {
      status: error instanceof NoteConflict ? 409 : 400,
      body: {
        error:
          error instanceof NoteConflict
            ? error.message
            : 'Local note operation failed. Check workspace files and permissions.',
      },
    }
  }
}

export function createDeviceClient(
  workspace: LocalWorkspace,
  origin: string,
  name: string,
  report: (message: string) => void,
) {
  let credential: DeviceCredential | null = null
  let socket: WebSocket | null = null
  let retry: ReturnType<typeof setTimeout> | undefined
  let heartbeat: ReturnType<typeof setInterval> | undefined
  let stopped = false
  let blocked = false
  let attempt = 0
  let generation = 0
  let controller: AbortController | null = null
  let tasks = Promise.resolve()
  let queued = 0
  let ready: (() => void) | null = null

  function schedule() {
    if (stopped || blocked || retry || !credential) return
    const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt++, 5)) + Math.random() * 500
    retry = setTimeout(() => {
      retry = undefined
      void connect()
    }, delay)
  }
  async function connect() {
    if (stopped || blocked || !credential || socket) return
    const current = credential
    const operation = ++generation
    const protocols = [
      DEVICE_PROTOCOL,
      `auth.${current.account.id}.${current.id}.${current.secret}`,
    ]
    controller = new AbortController()
    try {
      const probe = await fetch(`${origin}/api/device/socket`, {
        headers: { 'Sec-WebSocket-Protocol': protocols.join(', ') },
        redirect: 'error',
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
      })
      if (operation !== generation || stopped) return
      if (probe.status === 401 || probe.status === 403) {
        blocked = true
        report(
          'Device authorization unavailable or revoked. Pair this workspace again to enroll it.',
        )
        return
      }
      if (probe.status !== 204) throw new Error('Relay unavailable')
      const url = new URL(
        '/api/device/socket',
        deviceSocketOrigin(origin, probe.headers.get(LOCAL_RELAY_HEADER)),
      )
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      const active = new WebSocket(url, protocols)
      socket = active
      let lastPong = Date.now()
      active.addEventListener('open', () => {
        if (operation !== generation || stopped) {
          active.close()
          return
        }
        attempt = 0
        report(`Storage device online: ${current.name} (${current.account.login})`)
        ready?.()
        ready = null
        heartbeat = setInterval(() => {
          if (Date.now() - lastPong > 60_000) {
            clearInterval(heartbeat)
            if (socket === active) {
              socket = null
              generation++
              active.close()
              schedule()
            }
          } else if (active.readyState === WebSocket.OPEN) active.send('ping')
        }, 20_000)
      })
      active.addEventListener('message', event => {
        if (event.data === 'pong') {
          lastPong = Date.now()
          return
        }
        if (
          operation !== generation ||
          stopped ||
          typeof event.data !== 'string' ||
          Buffer.byteLength(event.data) > MAX_RELAY_BYTES
        )
          return
        let message: Record<string, unknown>
        try {
          message = JSON.parse(event.data)
        } catch {
          active.close(4003, 'Invalid JSON')
          return
        }
        if (
          !message ||
          message.type !== 'request' ||
          typeof message.id !== 'string' ||
          !/^[a-f0-9-]{36}$/.test(message.id)
        )
          return
        if (
          typeof message.expiresAt !== 'number' ||
          !Number.isFinite(message.expiresAt) ||
          queued >= 16
        ) {
          active.close(4003, 'Invalid or excessive request')
          return
        }
        const expiresAt = message.expiresAt
        const id = message.id
        queued++
        tasks = tasks
          .then(async () => {
            if (operation !== generation || stopped || active.readyState !== WebSocket.OPEN) return
            if (Date.now() >= expiresAt) {
              report(
                'Storage request expired before execution. Check the device clock and reload notes.',
              )
              active.close(4013, 'Request expired')
              return
            }
            const result = await runDeviceCommand(workspace, current.account, message)
            if (operation !== generation || stopped || active.readyState !== WebSocket.OPEN) return
            let reply = JSON.stringify({ type: 'result', id, ...result } satisfies DeviceResult)
            if (Buffer.byteLength(reply) > MAX_RELAY_BYTES)
              reply = JSON.stringify({
                type: 'result',
                id,
                status: 400,
                body: { error: 'Local notes response is too large' },
              })
            active.send(reply)
          })
          .catch(() => {
            if (operation === generation) active.close(4011, 'Operation failed')
          })
          .finally(() => {
            queued--
          })
      })
      active.addEventListener('close', event => {
        if (operation !== generation) return
        clearInterval(heartbeat)
        socket = null
        if (event.code === 1008) {
          blocked = true
          report('Storage connection unlinked or replaced. Pair again if needed.')
        } else {
          report('Storage device disconnected. Reconnecting without replaying writes.')
          schedule()
        }
      })
      active.addEventListener('error', () => {
        if (operation === generation) {
          clearInterval(heartbeat)
          socket = null
          active.close()
          schedule()
        }
      })
    } catch {
      if (operation === generation && !stopped) {
        report('Storage relay unavailable. Reconnecting.')
        schedule()
      }
    }
  }
  return {
    async start() {
      credential = await workspace.readDevice()
      if (credential) void connect()
    },
    async bind(account: LocalAccount, grant: string, challenge: string) {
      const previous = await workspace.readDevice()
      if (previous && previous.account.id !== account.id)
        throw new Error('Workspace belongs to another GitHub account')
      credential = previous ?? {
        version: 1,
        origin,
        account,
        name,
        id: randomUUID(),
        secret: randomBytes(32).toString('base64url'),
      }
      // Persist before registration so an uncertain HTTP result never loses the enrollment credential.
      await workspace.rememberDevice(credential)
      const response = await fetch(`${origin}/api/device/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant,
          challenge,
          id: credential.id,
          secret: credential.secret,
          name: credential.name,
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
      })
      if (!response.ok) {
        report(
          response.status === 409
            ? 'Another storage device is already bound. Unlink it in Web Settings first.'
            : `Device enrollment failed (${response.status}).`,
        )
        throw new Error('Device enrollment failed')
      }
      blocked = false
      clearTimeout(retry)
      retry = undefined
      if (socket?.readyState === WebSocket.OPEN) return
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          ready = null
          reject(new Error('Storage connection not confirmed'))
        }, 15_000)
        ready = () => {
          clearTimeout(timer)
          resolve()
        }
        void connect()
      })
    },
    stop() {
      stopped = true
      generation++
      controller?.abort()
      clearTimeout(retry)
      clearInterval(heartbeat)
      socket?.close(1000, 'CLI stopped')
      socket = null
    },
  }
}

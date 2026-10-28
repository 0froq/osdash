import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { open } from 'node:fs/promises'
import {
  LOCAL_BRIDGE_ORIGIN,
  LOCAL_BRIDGE_PROTOCOL,
  type LocalBridgeStatus,
  type LocalConfig,
  type LocalAccount,
  isLocalAccount,
  localUnitAddress,
} from '../shared/local-bridge.ts'

import type { LocalWorkspace } from './workspace.ts'

const PAIR_TTL_MS = 5 * 60 * 1000
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000
const MAX_BODY_BYTES = 4096

class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function sameSecret(actual: string, expected: string): boolean {
  const a = Buffer.from(actual)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function safeLocalConfig(raw: unknown): LocalConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid local config')
  const record = raw as Record<string, unknown>
  const locale = record.locale ?? 'system'
  if (locale !== 'system' && locale !== 'en' && locale !== 'zh-CN') {
    throw new Error('Invalid config locale')
  }
  return {
    locale,
    notesConfigured:
      typeof record.notesDirectory === 'string' && record.notesDirectory.trim().length > 0,
  }
}

export async function readLocalConfig(path: string): Promise<LocalConfig> {
  let file
  try {
    file = await open(path, 'r')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return safeLocalConfig({})
    throw error
  }
  try {
    const buffer = Buffer.alloc(64 * 1024 + 1)
    const { bytesRead } = await file.read(buffer)
    if (bytesRead > 64 * 1024) throw new Error('Config is too large')
    return safeLocalConfig(JSON.parse(buffer.subarray(0, bytesRead).toString('utf8')))
  } finally {
    await file.close()
  }
}

async function readJson(
  req: IncomingMessage,
  maxBytes = MAX_BODY_BYTES,
): Promise<Record<string, unknown>> {
  if (req.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') {
    throw new HttpError(415, 'JSON required')
  }
  const text = await new Promise<string>((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > maxBytes) {
        reject(new HttpError(413, 'Request too large'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
    req.on('aborted', () => reject(new HttpError(400, 'Request aborted')))
  })
  try {
    const body: unknown = JSON.parse(text)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid JSON')
    return body as Record<string, unknown>
  } catch {
    throw new HttpError(400, 'Invalid JSON')
  }
}

export function validateBridgeOrigin(origin: string): string {
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    throw new Error('Invalid bridge origin')
  }
  if (
    url.origin !== origin ||
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
  ) {
    throw new Error('Use an exact HTTPS origin, or an HTTP loopback origin for development')
  }
  return origin
}

export function createLocalBridge(options: {
  origin?: string
  readConfig: () => Promise<LocalConfig>
  now?: () => number
  workspace?: LocalWorkspace
  verifyAccount?: (grant: string, challenge: string) => Promise<LocalAccount>
  onPair?: (account: LocalAccount, grant: string, challenge: string) => Promise<void>
}) {
  const origin = validateBridgeOrigin(options.origin ?? LOCAL_BRIDGE_ORIGIN)
  const now = options.now ?? Date.now
  const STATUS: LocalBridgeStatus = {
    protocol: LOCAL_BRIDGE_PROTOCOL,
    capabilities:
      options.workspace && options.verifyAccount
        ? ['config:read', 'notes:read', 'notes:write']
        : ['config:read'],
    challenge: randomBytes(24).toString('base64url'),
  }
  const pairingCode = randomBytes(24).toString('base64url')
  const pairingExpiresAt = now() + PAIR_TTL_MS
  let consumed = false
  let failedAttempts = 0
  let credential: { token: string; expiresAt: number; account?: LocalAccount } | null = null

  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Vary', 'Origin')
    const respond = (status: number, value?: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(value === undefined ? undefined : JSON.stringify(value))
    }
    try {
      const address = server.address()
      if (
        !address ||
        typeof address === 'string' ||
        req.headers.host !== `127.0.0.1:${address.port}`
      ) {
        throw new HttpError(403, 'Host denied')
      }
      if (req.headers.origin !== origin) throw new HttpError(403, 'Origin denied')
      res.setHeader('Access-Control-Allow-Origin', origin)
      if (req.method === 'OPTIONS') {
        preflight(req, res)
        respond(204)
        return
      }
      if (req.url === '/v1/status' && req.method === 'GET') {
        respond(200, STATUS)
        return
      }
      if (req.url === '/v1/pair' && req.method === 'POST') {
        if (consumed || now() >= pairingExpiresAt)
          throw new HttpError(410, 'Pairing expired. Restart bridge.')
        if (failedAttempts >= 5) throw new HttpError(429, 'Pairing locked. Restart bridge.')
        const body = await readJson(req)
        // Recheck after body I/O so concurrent requests cannot replay the code.
        if (consumed || now() >= pairingExpiresAt)
          throw new HttpError(410, 'Pairing expired. Restart bridge.')
        if (failedAttempts >= 5) throw new HttpError(429, 'Pairing locked. Restart bridge.')
        if (typeof body.code !== 'string' || !sameSecret(body.code, pairingCode)) {
          failedAttempts += 1
          throw new HttpError(403, 'Invalid pairing code')
        }
        consumed = true
        let account: LocalAccount | undefined
        if (options.workspace) {
          try {
            if (!options.verifyAccount || typeof body.grant !== 'string')
              throw new Error('Grant required')
            account = await options.verifyAccount(body.grant, STATUS.challenge)
            if (!isLocalAccount(account)) throw new Error('Invalid account')
          } catch {
            consumed = false
            failedAttempts += 1
            throw new HttpError(403, 'GitHub account verification failed')
          }
          if (now() >= pairingExpiresAt)
            throw new HttpError(410, 'Pairing expired. Restart bridge.')
        }
        if (account && options.onPair) {
          try {
            await options.onPair(account, String(body.grant), STATUS.challenge)
          } catch {
            consumed = false
            throw new HttpError(
              409,
              'Storage device enrollment not confirmed. Check the CLI and existing device in Settings.',
            )
          }
        }
        credential = {
          token: randomBytes(32).toString('base64url'),
          expiresAt: now() + TOKEN_TTL_MS,
          account,
        }
        respond(200, {
          ...STATUS,
          token: credential.token,
          expiresAt: new Date(credential.expiresAt).toISOString(),
          ...(credential.account ? { account: credential.account } : {}),
        })
        return
      }
      const authorization = req.headers.authorization ?? ''
      const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
      if (!credential || now() >= credential.expiresAt || !sameSecret(token, credential.token)) {
        throw new HttpError(401, 'Pairing required')
      }
      const authenticated = credential
      const authorize = () => {
        if (credential !== authenticated || now() >= authenticated.expiresAt)
          throw new HttpError(401, 'Pairing required')
      }
      const parsed = new URL(req.url ?? '/', `http://127.0.0.1:${address.port}`)
      if (parsed.pathname === '/v1/notes' && options.workspace && authenticated.account) {
        const unit = parsed.searchParams.get('unit')
        let result: unknown
        try {
          if (req.method === 'GET' || req.method === 'DELETE') {
            if (!unit) throw new HttpError(400, 'Contribution id required')
            try {
              localUnitAddress(unit)
            } catch {
              throw new HttpError(400, 'Invalid contribution id')
            }
          }
          await options.workspace.readConfig()
          authorize()
          if (req.method === 'GET')
            result = { notes: await options.workspace.list(authenticated.account, unit!) }
          else if (req.method === 'POST') {
            const body = await readJson(req, 80 * 1024)
            authorize()
            if (typeof body.unit !== 'string') throw new HttpError(400, 'Contribution id required')
            try {
              localUnitAddress(body.unit)
            } catch {
              throw new HttpError(400, 'Invalid contribution id')
            }
            result = {
              note: await options.workspace.save(authenticated.account, body.unit, body.note),
            }
          } else if (req.method === 'DELETE') {
            await options.workspace.remove(
              authenticated.account,
              unit!,
              parsed.searchParams.get('id') ?? '',
            )
            result = { ok: true }
          } else throw new HttpError(405, 'Method denied')
        } catch (error) {
          if (error instanceof HttpError) throw error
          throw new HttpError(
            409,
            'Local note operation failed. Check workspace files and permissions.',
          )
        }
        authorize()
        respond(200, result)
        return
      }
      if (req.url === '/v1/config' && req.method === 'GET') {
        try {
          const config = await options.readConfig()
          // Pick fields again. Never serialize an arbitrary config object.
          respond(200, { locale: config.locale, notesConfigured: config.notesConfigured })
        } catch {
          throw new HttpError(503, 'Local configuration unavailable')
        }
        return
      }
      if (req.url === '/v1/pair' && req.method === 'DELETE') {
        credential = null
        respond(204)
        return
      }
      throw new HttpError(404, 'Not found')
    } catch (error) {
      respond(error instanceof HttpError ? error.status : 500, {
        error: error instanceof HttpError ? error.message : 'Bridge request failed',
      })
    }
  })
  server.requestTimeout = 10_000
  server.headersTimeout = 10_000
  server.maxHeadersCount = 32
  return { server, pairingCode, pairingExpiresAt }
}

function preflight(req: IncomingMessage, res: ServerResponse) {
  const method = req.headers['access-control-request-method']
  if (!method || !['GET', 'POST', 'DELETE'].includes(method))
    throw new HttpError(403, 'Method denied')
  const headers = String(req.headers['access-control-request-headers'] ?? '')
    .toLowerCase()
    .split(',')
    .map(header => header.trim())
    .filter(Boolean)
  if (headers.some(header => !['authorization', 'content-type'].includes(header))) {
    throw new HttpError(403, 'Headers denied')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  if (req.headers['access-control-request-private-network'] === 'true') {
    res.setHeader('Access-Control-Allow-Private-Network', 'true')
  }
}

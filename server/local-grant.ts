import { SignJWT, jwtVerify } from 'jose'
import { isLocalAccount, type LocalAccount } from '../shared/local-bridge'

const AUDIENCE = 'osdash-local-bridge'
const TTL_SECONDS = 90

async function signingKey(secret: string) {
  if (!secret) throw new Error('Session secret required')
  return new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`osdash-local-grant:v1\0${secret}`),
    ),
  )
}

function checkChallenge(challenge: string) {
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(challenge)) throw new Error('Invalid bridge challenge')
}

export async function issueLocalGrant(input: {
  secret: string
  account: LocalAccount
  origin: string
  challenge: string
  nowMs: number
}): Promise<string> {
  checkChallenge(input.challenge)
  if (!isLocalAccount(input.account)) throw new Error('Invalid GitHub identity')
  const now = Math.floor(input.nowMs / 1000)
  return new SignJWT({
    login: input.account.login,
    challenge: input.challenge,
    purpose: 'device:bind',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(input.account.id)
    .setIssuer(input.origin)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + TTL_SECONDS)
    .sign(await signingKey(input.secret))
}

export async function verifyLocalGrant(input: {
  secret: string
  grant: string
  origin: string
  challenge: string
  nowMs: number
}): Promise<LocalAccount> {
  checkChallenge(input.challenge)
  const { payload } = await jwtVerify(input.grant, await signingKey(input.secret), {
    algorithms: ['HS256'],
    issuer: input.origin,
    audience: AUDIENCE,
    maxTokenAge: TTL_SECONDS,
    requiredClaims: ['sub', 'iat', 'exp'],
    currentDate: new Date(input.nowMs),
  })
  const account = { id: payload.sub, login: payload.login }
  if (
    payload.purpose !== 'device:bind' ||
    payload.challenge !== input.challenge ||
    !isLocalAccount(account)
  )
    throw new Error('Invalid local grant')
  return account
}

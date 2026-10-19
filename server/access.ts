import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
const remoteKeys = new Map<string, JWTVerifyGetKey>()

export function accessIssuer(teamDomain: string): string {
  const trimmed = teamDomain.trim().replace(/\/+$/, '')
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new Error('ACCESS_TEAM_DOMAIN 无效')
  }
  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    url.port !== '' ||
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    throw new Error('ACCESS_TEAM_DOMAIN 无效')
  }
  const host = url.hostname.toLowerCase()
  if (host.endsWith('.cloudflareaccess.com')) {
    const slug = host.slice(0, -'.cloudflareaccess.com'.length)
    if (!SLUG.test(slug)) throw new Error('ACCESS_TEAM_DOMAIN 无效')
    return `https://${slug}.cloudflareaccess.com`
  }
  if (!SLUG.test(host)) throw new Error('ACCESS_TEAM_DOMAIN 无效')
  return `https://${host}.cloudflareaccess.com`
}

export function accessCertsUrl(teamDomain: string): string {
  return `${accessIssuer(teamDomain)}/cdn-cgi/access/certs`
}

function keysFor(issuer: string): JWTVerifyGetKey {
  const cached = remoteKeys.get(issuer)
  if (cached) return cached
  const keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`))
  remoteKeys.set(issuer, keys)
  return keys
}

export async function verifyAccessJwt(
  jwt: string,
  options: { teamDomain: string; audience: string; keys?: JWTVerifyGetKey },
): Promise<void> {
  const issuer = accessIssuer(options.teamDomain)
  await jwtVerify(jwt, options.keys ?? keysFor(issuer), {
    issuer,
    audience: options.audience,
    algorithms: ['RS256'],
  })
}

export async function evaluateAccess(input: {
  dev: boolean
  assertion: string | undefined
  teamDomain: string | undefined
  audience: string | undefined
  keys?: JWTVerifyGetKey
}): Promise<'ok' | 'forbidden'> {
  if (input.dev) return 'ok'
  if (!input.assertion || !input.teamDomain || !input.audience) return 'forbidden'
  try {
    await verifyAccessJwt(input.assertion, {
      teamDomain: input.teamDomain,
      audience: input.audience,
      keys: input.keys,
    })
    return 'ok'
  } catch {
    return 'forbidden'
  }
}

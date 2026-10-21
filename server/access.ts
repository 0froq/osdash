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
    throw new Error('Invalid ACCESS_TEAM_DOMAIN')
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
    throw new Error('Invalid ACCESS_TEAM_DOMAIN')
  }
  const host = url.hostname.toLowerCase()
  if (host.endsWith('.cloudflareaccess.com')) {
    const slug = host.slice(0, -'.cloudflareaccess.com'.length)
    if (!SLUG.test(slug)) throw new Error('Invalid ACCESS_TEAM_DOMAIN')
    return `https://${slug}.cloudflareaccess.com`
  }
  if (!SLUG.test(host)) throw new Error('Invalid ACCESS_TEAM_DOMAIN')
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

/** Split `ACCESS_AUD` on commas. Blank segments are dropped. */
export function accessAudiences(value: string | readonly string[] | undefined): string[] {
  if (value === undefined) return []
  const pieces = typeof value === 'string' ? [value] : value
  return pieces
    .flatMap(piece => piece.split(','))
    .map(piece => piece.trim())
    .filter(piece => piece !== '')
}

export async function verifyAccessJwt(
  jwt: string,
  options: { teamDomain: string; audience: readonly string[]; keys?: JWTVerifyGetKey },
): Promise<void> {
  const audience = accessAudiences(options.audience)
  if (audience.length === 0) throw new Error('Invalid ACCESS_AUD')
  const issuer = accessIssuer(options.teamDomain)
  await jwtVerify(jwt, options.keys ?? keysFor(issuer), {
    issuer,
    audience,
    algorithms: ['RS256'],
  })
}

export async function evaluateAccess(input: {
  dev: boolean
  assertion: string | undefined
  teamDomain: string | undefined
  audience: string | readonly string[] | undefined
  keys?: JWTVerifyGetKey
}): Promise<'ok' | 'forbidden'> {
  if (input.dev) return 'ok'
  const audience = accessAudiences(input.audience)
  if (!input.assertion || !input.teamDomain || audience.length === 0) {
    console.warn('osdash access: forbidden', {
      assertion: Boolean(input.assertion),
      teamDomain: Boolean(input.teamDomain),
      audiences: audience.length,
    })
    return 'forbidden'
  }
  try {
    await verifyAccessJwt(input.assertion, {
      teamDomain: input.teamDomain,
      audience,
      keys: input.keys,
    })
    return 'ok'
  } catch (error) {
    console.warn(
      'osdash access: jwt rejected',
      error instanceof Error ? error.message : String(error),
    )
    return 'forbidden'
  }
}

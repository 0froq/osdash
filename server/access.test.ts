import assert from 'node:assert/strict'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from 'jose'
import { it } from 'vite-plus/test'
import { accessCertsUrl, accessIssuer, evaluateAccess } from './access'

const TEAM = 'froq'
const ISSUER = 'https://froq.cloudflareaccess.com'
const AUD = '4714c1358e65fe4b408ad6d432a5f878f08194bdb4752441fd56faefa9b2b6f2'

async function fixture(): Promise<{
  keys: JWTVerifyGetKey
  sign: (overrides?: { issuer?: string; audience?: string; exp?: number }) => Promise<string>
}> {
  const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true })
  const jwk = await exportJWK(publicKey)
  jwk.alg = 'RS256'
  jwk.use = 'sig'
  jwk.kid = 'test'
  const keys = createLocalJWKSet({ keys: [jwk] })
  const sign = (overrides: { issuer?: string; audience?: string; exp?: number } = {}) => {
    const exp = overrides.exp
    return new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'test' })
      .setIssuer(overrides.issuer ?? ISSUER)
      .setAudience(overrides.audience ?? AUD)
      .setIssuedAt(exp === undefined ? undefined : exp - 120)
      .setExpirationTime(exp ?? '2h')
      .sign(privateKey)
  }
  return { keys, sign }
}

it('builds the team JWKS url from a slug or a team domain', () => {
  assert.equal(accessIssuer('froq'), ISSUER)
  assert.equal(accessIssuer('froq.cloudflareaccess.com'), ISSUER)
  assert.equal(accessIssuer('https://froq.cloudflareaccess.com'), ISSUER)
  assert.equal(accessIssuer('https://froq.cloudflareaccess.com/'), ISSUER)
  assert.equal(accessCertsUrl(TEAM), `${ISSUER}/cdn-cgi/access/certs`)
  assert.throws(() => accessIssuer('https://evil.example/certs'), /Invalid ACCESS_TEAM_DOMAIN/)
  assert.throws(
    () => accessIssuer('https://froq.cloudflareaccess.com/cdn-cgi/access/certs'),
    /Invalid ACCESS_TEAM_DOMAIN/,
  )
  assert.throws(() => accessIssuer('not a domain'), /Invalid ACCESS_TEAM_DOMAIN/)
})

it('accepts a token signed for this team and audience', async () => {
  const { keys, sign } = await fixture()
  const assertion = await sign()
  assert.equal(
    await evaluateAccess({ dev: false, assertion, teamDomain: TEAM, audience: AUD, keys }),
    'ok',
  )
})

it('rejects a missing header, a missing env var, the wrong audience, and a bad signature', async () => {
  const { keys, sign } = await fixture()
  const assertion = await sign()
  assert.equal(
    await evaluateAccess({
      dev: false,
      assertion: undefined,
      teamDomain: TEAM,
      audience: AUD,
      keys,
    }),
    'forbidden',
  )
  assert.equal(
    await evaluateAccess({ dev: false, assertion: '', teamDomain: TEAM, audience: AUD, keys }),
    'forbidden',
  )
  assert.equal(
    await evaluateAccess({ dev: false, assertion, teamDomain: undefined, audience: AUD, keys }),
    'forbidden',
  )
  assert.equal(
    await evaluateAccess({ dev: false, assertion, teamDomain: TEAM, audience: 'other-aud', keys }),
    'forbidden',
  )
  const other = await generateKeyPair('RS256', { extractable: true })
  const forged = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer(ISSUER)
    .setAudience(AUD)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(other.privateKey)
  assert.equal(
    await evaluateAccess({ dev: false, assertion: forged, teamDomain: TEAM, audience: AUD, keys }),
    'forbidden',
  )
})

it('rejects an expired token and a token from another issuer', async () => {
  const { keys, sign } = await fixture()
  const expired = await sign({ exp: Math.floor(Date.now() / 1000) - 60 })
  const outsider = await sign({ issuer: 'https://other.cloudflareaccess.com' })
  assert.equal(
    await evaluateAccess({ dev: false, assertion: expired, teamDomain: TEAM, audience: AUD, keys }),
    'forbidden',
  )
  assert.equal(
    await evaluateAccess({
      dev: false,
      assertion: outsider,
      teamDomain: TEAM,
      audience: AUD,
      keys,
    }),
    'forbidden',
  )
})

it('accepts a token for a later audience in a comma-separated ACCESS_AUD', async () => {
  const { keys, sign } = await fixture()
  const preview = '9c2e1b0a4d6f8e7c5b3a1928374655647382910a0b1c2d3e4f5061728394a5b6'
  const assertion = await sign({ audience: preview })
  assert.equal(
    await evaluateAccess({
      dev: false,
      assertion,
      teamDomain: TEAM,
      audience: ` ${AUD} , , ${preview} `,
      keys,
    }),
    'ok',
  )
})

it('rejects a token whose audience is not in the ACCESS_AUD list', async () => {
  const { keys, sign } = await fixture()
  const assertion = await sign({ audience: 'not-in-the-list' })
  assert.equal(
    await evaluateAccess({
      dev: false,
      assertion,
      teamDomain: TEAM,
      audience: `${AUD}, preview-aud`,
      keys,
    }),
    'forbidden',
  )
  assert.equal(
    await evaluateAccess({
      dev: false,
      assertion: await sign(),
      teamDomain: TEAM,
      audience: ' , ',
      keys,
    }),
    'forbidden',
  )
})

it('skips validation in local dev', async () => {
  assert.equal(
    await evaluateAccess({
      dev: true,
      assertion: undefined,
      teamDomain: undefined,
      audience: undefined,
    }),
    'ok',
  )
})

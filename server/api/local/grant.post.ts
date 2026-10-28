import { createError, defineEventHandler, getHeader, readBody, setHeader } from 'h3'
import { bindingString } from '../../bindings'
import { fetchGitHubUser } from '../../auth/github-oauth'
import { getRequestOrigin } from '../../request-origin'
import { issueLocalGrant } from '../../local-grant'

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'no-store')
  const user = event.context.osdashUser
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  const origin = getRequestOrigin(event)
  if (getHeader(event, 'origin') !== origin)
    throw createError({ statusCode: 403, statusMessage: 'Origin denied' })
  const body = await readBody<{ challenge?: unknown }>(event)
  if (
    !body ||
    typeof body.challenge !== 'string' ||
    !/^[A-Za-z0-9_-]{32,64}$/.test(body.challenge)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid bridge challenge' })
  }
  const secret = bindingString(event, 'SESSION_SECRET')
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'Authentication unavailable' })
  const profile = await fetchGitHubUser(user.token)
  if (profile.login.toLowerCase() !== user.login.toLowerCase()) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in again to confirm your account' })
  }
  const account = { id: profile.id, login: profile.login }
  const grant = await issueLocalGrant({
    secret,
    account,
    origin,
    challenge: body.challenge,
    nowMs: Date.now(),
  })
  return { grant, account }
})

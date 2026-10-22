import { createError, getQuery, sendRedirect, type H3Event } from 'h3'
import { bindingString, workerEnv } from '../../bindings'
import { readCache } from '../../cache'
import { exchangeOAuthCode, fetchGitHubUser } from '../../auth/github-oauth'
import { parseCallbackOrigin, planOAuthCallback, verifyOAuthState } from '../../auth/oauth-state'
import { getRequestOrigin } from '../../request-origin'
import { createSession, setSessionCookie } from '../../session'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''
  if (!code || !state) {
    throw createError({ statusCode: 400, statusMessage: 'Missing OAuth code or state' })
  }

  const store = workerEnv(event).CACHE
  const requestOrigin = getRequestOrigin(event)
  const callbackOrigin = callbackOriginFromEvent(event)
  let redirectUri: string
  if (callbackOrigin) {
    const sessionSecret = bindingString(event, 'SESSION_SECRET')
    if (!sessionSecret) {
      throw createError({ statusCode: 503, statusMessage: 'OAuth is not configured' })
    }
    const verified = await verifyOAuthState(sessionSecret, state, Date.now())
    const plan = planOAuthCallback({
      requestOrigin,
      callbackOrigin,
      verifiedOrigin: verified?.origin ?? null,
      code,
      state,
    })
    switch (plan.action) {
      case 'reject':
        throw createError({ statusCode: 400, statusMessage: 'Invalid OAuth state' })
      case 'bounce':
        return sendRedirect(event, plan.location, 302)
      case 'exchange':
        redirectUri = plan.redirectUri
        break
      default: {
        const unreachable: never = plan
        throw new Error(`unexpected oauth plan ${String(unreachable)}`)
      }
    }
  } else {
    const stateHit = await readCache(store, `oauth:v1:${state}`, Date.now())
    if (!stateHit) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid OAuth state' })
    }
    redirectUri = `${requestOrigin}/api/auth/callback`
  }

  const clientId = bindingString(event, 'GITHUB_CLIENT_ID')
  const clientSecret = bindingString(event, 'GITHUB_CLIENT_SECRET')
  const sessionSecret = bindingString(event, 'SESSION_SECRET')
  if (!clientId || !clientSecret || !sessionSecret) {
    throw createError({ statusCode: 503, statusMessage: 'OAuth is not configured' })
  }

  const token = await exchangeOAuthCode(clientId, clientSecret, code, redirectUri)
  const profile = await fetchGitHubUser(token)
  const sessionId = await createSession(store, sessionSecret, {
    login: profile.login,
    token,
    name: profile.name ?? undefined,
    avatarUrl: profile.avatarUrl ?? undefined,
  })
  setSessionCookie(event, sessionId)
  return sendRedirect(event, '/', 302)
})

function callbackOriginFromEvent(event: H3Event): string | undefined {
  const parsed = parseCallbackOrigin(bindingString(event, 'OAUTH_CALLBACK_ORIGIN'))
  switch (parsed.status) {
    case 'unset':
      return undefined
    case 'invalid':
      throw createError({ statusCode: 503, statusMessage: 'OAUTH_CALLBACK_ORIGIN is invalid' })
    case 'set':
      return parsed.origin
    default: {
      const unreachable: never = parsed
      throw new Error(`unexpected callback origin ${String(unreachable)}`)
    }
  }
}

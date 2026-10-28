import { createError, sendRedirect, type H3Event } from 'h3'
import { bindingString } from '../../bindings'
import { oauthAuthorizeUrl } from '../../auth/github-oauth'
import { parseCallbackOrigin, resolveOAuthStart, signOAuthState } from '../../auth/oauth-state'
import { getRequestOrigin } from '../../request-origin'

const STATE_TTL_MS = 10 * 60 * 1000

export default defineEventHandler(async event => {
  const clientId = bindingString(event, 'GITHUB_CLIENT_ID')
  if (!clientId) {
    throw createError({ statusCode: 503, statusMessage: 'GITHUB_CLIENT_ID is not configured' })
  }
  const callbackOrigin = callbackOriginFromEvent(event)
  const start = resolveOAuthStart(getRequestOrigin(event), callbackOrigin)
  if (!start.ok) {
    throw createError({ statusCode: 400, statusMessage: 'OAuth return origin is not allowed' })
  }
  const sessionSecret = bindingString(event, 'SESSION_SECRET')
  if (!sessionSecret) {
    throw createError({ statusCode: 503, statusMessage: 'OAuth is not configured' })
  }
  const state = await signOAuthState(sessionSecret, {
    origin: start.returnOrigin,
    exp: Date.now() + STATE_TTL_MS,
  })
  return sendRedirect(event, oauthAuthorizeUrl(clientId, start.redirectUri, state), 302)
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

import { createError, sendRedirect, type H3Event } from 'h3'
import { bindingString, workerEnv } from '../../bindings'
import { writeCache } from '../../cache'
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

  let state: string
  switch (start.mode) {
    case 'fixed': {
      const sessionSecret = bindingString(event, 'SESSION_SECRET')
      if (!sessionSecret) {
        throw createError({ statusCode: 503, statusMessage: 'OAuth is not configured' })
      }
      state = await signOAuthState(sessionSecret, {
        origin: start.returnOrigin,
        exp: Date.now() + STATE_TTL_MS,
      })
      break
    }
    case 'legacy': {
      state = crypto.randomUUID()
      await writeCache(workerEnv(event).CACHE, `oauth:v1:${state}`, '1', 600, Date.now())
      break
    }
    default: {
      const unreachable: never = start
      throw new Error(`unexpected oauth start ${String(unreachable)}`)
    }
  }
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

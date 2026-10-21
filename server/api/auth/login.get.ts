import { createError, sendRedirect } from 'h3'
import { bindingString, workerEnv } from '../../bindings'
import { writeCache } from '../../cache'
import { oauthAuthorizeUrl } from '../../auth/github-oauth'
import { getRequestOrigin } from '../../request-origin'

export default defineEventHandler(async event => {
  const clientId = bindingString(event, 'GITHUB_CLIENT_ID')
  if (!clientId) {
    throw createError({ statusCode: 503, statusMessage: 'GITHUB_CLIENT_ID is not configured' })
  }
  const origin = getRequestOrigin(event)
  const redirectUri = `${origin}/api/auth/callback`
  const state = crypto.randomUUID()
  const store = workerEnv(event).CACHE
  await writeCache(store, `oauth:v1:${state}`, '1', 600, Date.now())
  return sendRedirect(event, oauthAuthorizeUrl(clientId, redirectUri, state), 302)
})

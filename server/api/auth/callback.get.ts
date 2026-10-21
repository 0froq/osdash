import { createError, getQuery, sendRedirect } from 'h3'
import { bindingString, workerEnv } from '../../bindings'
import { readCache } from '../../cache'
import { exchangeOAuthCode, fetchGitHubLogin } from '../../auth/github-oauth'
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
  const stateHit = await readCache(store, `oauth:v1:${state}`, Date.now())
  if (!stateHit) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid OAuth state' })
  }

  const clientId = bindingString(event, 'GITHUB_CLIENT_ID')
  const clientSecret = bindingString(event, 'GITHUB_CLIENT_SECRET')
  const sessionSecret = bindingString(event, 'SESSION_SECRET')
  if (!clientId || !clientSecret || !sessionSecret) {
    throw createError({ statusCode: 503, statusMessage: 'OAuth is not configured' })
  }

  const origin = getRequestOrigin(event)
  const redirectUri = `${origin}/api/auth/callback`
  const token = await exchangeOAuthCode(clientId, clientSecret, code, redirectUri)
  const login = await fetchGitHubLogin(token)
  const sessionId = await createSession(store, sessionSecret, { login, token })
  setSessionCookie(event, sessionId)
  return sendRedirect(event, '/', 302)
})

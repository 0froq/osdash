import { bindingString, workerEnv } from '../../bindings'
import { clearSessionCookie, destroySession, sessionIdFromEvent } from '../../session'

export default defineEventHandler(async event => {
  const sessionId = sessionIdFromEvent(event)
  const secret = bindingString(event, 'SESSION_SECRET')
  if (sessionId && secret) {
    await destroySession(workerEnv(event).CACHE, sessionId)
  }
  clearSessionCookie(event)
  return { ok: true }
})

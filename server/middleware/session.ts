import { bindingString, workerEnv } from '../bindings'
import { readSession, sessionIdFromEvent } from '../session'

declare module 'h3' {
  interface H3EventContext {
    osdashUser?: {
      login: string
      token: string
    }
  }
}

export default defineEventHandler(async event => {
  const path = event.path
  if (path.startsWith('/api/auth/')) return

  const sessionId = sessionIdFromEvent(event)
  if (!sessionId) return

  const secret = bindingString(event, 'SESSION_SECRET')
  if (!secret) return

  const user = await readSession(workerEnv(event).CACHE, secret, sessionId)
  if (!user) return
  event.context.osdashUser = user
})

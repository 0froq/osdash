import { createError } from 'h3'
import { parseClefLogins, readByok, usesWorkersAiClef } from '../byok'
import { bindingString, workerEnv } from '../bindings'
import { devMock } from '../mock-state'

export default defineEventHandler(async event => {
  if (devMock(event)) {
    return { configured: false as const, baseUrl: '', model: '', clefBuiltIn: false }
  }
  const user = event.context.osdashUser
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  const secret = bindingString(event, 'SESSION_SECRET')
  if (!secret)
    throw createError({ statusCode: 503, statusMessage: 'SESSION_SECRET is not configured' })
  const settings = await readByok(workerEnv(event).CACHE, secret, user.login)
  const clefBuiltIn = usesWorkersAiClef(
    user.login,
    parseClefLogins(bindingString(event, 'OSDASH_CLEF_LOGINS')),
  )
  if (!settings) {
    return { configured: false as const, baseUrl: '', model: '', clefBuiltIn }
  }
  return {
    configured: true as const,
    baseUrl: settings.baseUrl,
    model: settings.model,
    clefBuiltIn,
  }
})

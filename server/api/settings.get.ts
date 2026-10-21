import { createError } from 'h3'
import { readByok } from '../byok'
import { bindingString, workerEnv } from '../bindings'

export default defineEventHandler(async event => {
  const user = event.context.osdashUser
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  const secret = bindingString(event, 'SESSION_SECRET')
  if (!secret)
    throw createError({ statusCode: 503, statusMessage: 'SESSION_SECRET is not configured' })
  const settings = await readByok(workerEnv(event).CACHE, secret, user.login)
  if (!settings) {
    return { configured: false as const, baseUrl: '', model: '' }
  }
  return {
    configured: true as const,
    baseUrl: settings.baseUrl,
    model: settings.model,
  }
})

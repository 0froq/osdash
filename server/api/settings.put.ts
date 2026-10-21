import { createError, readBody } from 'h3'
import { readByok, writeByok, type ByokSettings } from '../byok'
import { bindingString, workerEnv } from '../bindings'
import { devMock } from '../mock-state'

type SettingsBody = {
  baseUrl?: string
  apiKey?: string
  model?: string
  clear?: boolean
}

export default defineEventHandler(async event => {
  const body = (await readBody(event)) as SettingsBody
  if (devMock(event)) return { ok: true, configured: body.clear !== true }

  const user = event.context.osdashUser
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  const secret = bindingString(event, 'SESSION_SECRET')
  if (!secret)
    throw createError({ statusCode: 503, statusMessage: 'SESSION_SECRET is not configured' })

  const store = workerEnv(event).CACHE

  if (body.clear) {
    await writeByok(store, secret, user.login, null)
    return { ok: true, configured: false }
  }

  const baseUrl = body.baseUrl?.trim() ?? ''
  const apiKey = body.apiKey?.trim() ?? ''
  const model = body.model?.trim() ?? ''
  if (!baseUrl || !model) {
    throw createError({ statusCode: 400, statusMessage: 'baseUrl and model are required' })
  }

  const existing = await readByok(store, secret, user.login)
  const next: ByokSettings = {
    baseUrl,
    model,
    apiKey: apiKey || existing?.apiKey || '',
  }
  if (!next.apiKey) {
    throw createError({ statusCode: 400, statusMessage: 'apiKey is required' })
  }

  await writeByok(store, secret, user.login, next)
  return { ok: true, configured: true }
})

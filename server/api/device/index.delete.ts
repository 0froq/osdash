import { createError, defineEventHandler } from 'h3'
import { deviceAccount, deviceBody, deviceStub, sameOrigin } from '../../device-api'
export default defineEventHandler(async event => {
  sameOrigin(event)
  const account = await deviceAccount(event)
  const body = await deviceBody(event)
  if (typeof body.id !== 'string')
    throw createError({ statusCode: 400, statusMessage: 'Device id required' })
  try {
    await deviceStub(event, account).revoke(body.id)
  } catch {
    throw createError({
      statusCode: 409,
      statusMessage: 'Storage device changed. Reload settings.',
    })
  }
  return { ok: true }
})

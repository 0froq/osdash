import { createError, defineEventHandler, setHeader } from 'h3'
import { bindingString } from '../../bindings'
import { deviceBody, deviceStub } from '../../device-api'
import { verifyLocalGrant } from '../../local-grant'
import { getRequestOrigin } from '../../request-origin'
import { isLocalNoteId } from '../../../shared/local-bridge'
import { validSecret } from '../../../shared/device-relay'

// Called by the CLI. The short-lived, challenge-bound grant authorizes enrollment.
export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'no-store')
  const body = await deviceBody(event)
  if (
    typeof body.grant !== 'string' ||
    body.grant.length > 4096 ||
    typeof body.challenge !== 'string' ||
    typeof body.id !== 'string' ||
    !isLocalNoteId(body.id) ||
    !validSecret(body.secret) ||
    typeof body.name !== 'string' ||
    !body.name.trim() ||
    body.name.length > 64
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid device enrollment' })
  }
  const secret = bindingString(event, 'SESSION_SECRET')
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'Authentication unavailable' })
  let account
  try {
    account = await verifyLocalGrant({
      secret,
      grant: body.grant,
      challenge: body.challenge,
      origin: getRequestOrigin(event),
      nowMs: Date.now(),
    })
  } catch {
    throw createError({ statusCode: 403, statusMessage: 'Invalid or expired device grant' })
  }
  try {
    const device = await deviceStub(event, account).register(account, {
      id: body.id,
      secret: body.secret,
      name: body.name,
    })
    return { account, device }
  } catch (error) {
    if (error instanceof Error && error.message.includes('DEVICE_ALREADY_BOUND'))
      throw createError({
        statusCode: 409,
        statusMessage: 'Another storage device is bound. Unlink it in Settings first.',
      })
    throw error
  }
})

import { createError, defineEventHandler, readBody, setHeader } from 'h3'
import { bindingString } from '../../bindings'
import { getRequestOrigin } from '../../request-origin'
import { verifyLocalGrant } from '../../local-grant'

// No session cookie is sent by the bridge. The short-lived grant is its proof.
export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'no-store')
  const secret = bindingString(event, 'SESSION_SECRET')
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'Authentication unavailable' })
  const body = await readBody<{ grant?: unknown; challenge?: unknown }>(event)
  if (
    !body ||
    typeof body.grant !== 'string' ||
    body.grant.length > 4096 ||
    typeof body.challenge !== 'string'
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid local grant' })
  }
  try {
    const account = await verifyLocalGrant({
      secret,
      grant: body.grant,
      challenge: body.challenge,
      origin: getRequestOrigin(event),
      nowMs: Date.now(),
    })
    return { account }
  } catch {
    throw createError({ statusCode: 403, statusMessage: 'Invalid or expired local grant' })
  }
})

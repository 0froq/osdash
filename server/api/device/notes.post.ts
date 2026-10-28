import { defineEventHandler } from 'h3'
import { deviceAccount, deviceBody, relayNotes, sameOrigin } from '../../device-api'
export default defineEventHandler(async event => {
  sameOrigin(event)
  await deviceAccount(event)
  const body = await deviceBody(event)
  return relayNotes(event, {
    action: 'save',
    unit: body.unit,
    note: body.note,
    version: body.version,
  })
})

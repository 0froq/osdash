import { defineEventHandler } from 'h3'
import { deviceAccount, deviceBody, relayNotes, sameOrigin } from '../../device-api'
export default defineEventHandler(async event => {
  sameOrigin(event)
  await deviceAccount(event)
  const body = await deviceBody(event)
  return relayNotes(event, {
    action: 'delete',
    unit: body.unit,
    noteId: body.noteId,
    version: body.version,
  })
})

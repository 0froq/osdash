import { defineEventHandler, getQuery } from 'h3'
import { relayNotes } from '../../device-api'
export default defineEventHandler(event =>
  relayNotes(event, { action: 'list', unit: getQuery(event).unit }),
)

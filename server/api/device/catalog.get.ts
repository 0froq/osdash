import { defineEventHandler, getQuery } from 'h3'
import { relayNotes } from '../../device-api'

export default defineEventHandler(event =>
  relayNotes(event, { action: 'catalog', after: getQuery(event).after }),
)

import { createError, getQuery } from 'h3'
import { workerEnv } from '../bindings'
import { readInboxCache } from '../inbox-response'
import { mockTimeline } from '../mock'
import { devMock } from '../mock-state'
import { assembleTimeline } from '../timeline-response'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const id = typeof query.id === 'string' ? query.id : ''
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const nowMs = Date.now()
  if (devMock(event)) {
    const body = mockTimeline(id, nowMs)
    if (!body) throw createError({ statusCode: 404, statusMessage: 'Card not found' })
    return body
  }

  const user = event.context.osdashUser
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })

  const store = workerEnv(event).CACHE
  const inbox = await readInboxCache(store, user.login, nowMs)
  const unit = inbox?.units.find(entry => entry.id === id) ?? null
  if (!unit) throw createError({ statusCode: 404, statusMessage: 'Card not found' })

  const body = await assembleTimeline({
    token: user.token,
    login: user.login,
    unit,
    store,
    nowMs,
    fresh: query.refresh === '1',
  })
  if (!body) throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  return body
})

import { createError, readBody } from 'h3'
import { readInboxCache } from '../inbox-response'
import { workerEnv } from '../bindings'
import { writeSeen, type SeenMark } from '../user-state'

type SeenBody = {
  id?: string
  at?: string
  items?: SeenMark[]
}

export default defineEventHandler(async event => {
  const user = event.context.osdashUser
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })

  const body = (await readBody(event)) as SeenBody
  const marks: SeenMark[] = []
  if (Array.isArray(body.items)) {
    for (const item of body.items) {
      if (item && typeof item.id === 'string' && typeof item.at === 'string') marks.push(item)
    }
  } else if (typeof body.id === 'string' && typeof body.at === 'string') {
    marks.push({ id: body.id, at: body.at })
  }
  if (marks.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'id and at are required' })
  }

  const nowMs = Date.now()
  const store = workerEnv(event).CACHE
  const cached = await readInboxCache(store, user.login, nowMs)
  const seen = await writeSeen(store, user.login, marks, cached?.units ?? [], nowMs)
  return { ok: true as const, seen }
})

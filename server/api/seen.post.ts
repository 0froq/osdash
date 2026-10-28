import { createError, readBody } from 'h3'
import { devMock } from '../mock-state'
import { forgetThreads, markThreadsRead } from '../notifications'

type ReadBody = {
  threadIds?: string[]
}

export default defineEventHandler(async event => {
  const user = event.context.osdashUser
  if (!user && !devMock(event))
    throw createError({ statusCode: 401, statusMessage: 'Sign in required' })

  const body = (await readBody(event)) as ReadBody
  const threadIds = Array.isArray(body.threadIds)
    ? body.threadIds.filter(id => typeof id === 'string' && id.length > 0 && id.length <= 32)
    : []
  if (threadIds.length === 0) return { ok: true as const }
  if (devMock(event)) return { ok: true as const }
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })

  await markThreadsRead(user.token, threadIds)
  await forgetThreads(user.login, threadIds, undefined, Date.now())
  return { ok: true as const }
})

import { createError, getQuery } from 'h3'
import { BOARD_STALE_MS, buildBoardPayload, persistBoard, readBoardCache } from '../board-response'
import { workerEnv } from '../bindings'
import { mockItems } from '../mock'
import { createNotionSource } from '../notion'
import { summarize } from '../../shared/turn'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const now = new Date()
  const mock = import.meta.dev && (query.mock === '1' || process.env.OSDASH_MOCK === '1')
  if (mock) {
    const items = mockItems(now.getTime())
    return {
      generatedAt: now.toISOString(),
      cached: false,
      revalidating: false,
      truncated: false,
      mock: true,
      notion: { connected: createNotionSource().connected },
      stats: summarize(items),
      items,
      viewerLogin: 'octo-dev',
    }
  }

  const user = event.context.osdashUser
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  }

  const refresh = query.refresh === '1'
  const store = workerEnv(event).CACHE
  const nowMs = now.getTime()

  if (!refresh) {
    const cached = await readBoardCache(store, user.login, nowMs)
    if (cached) {
      const ageMs = nowMs - Date.parse(cached.generatedAt)
      const stale = ageMs >= BOARD_STALE_MS
      const waitUntil = event.context.cloudflare?.context?.waitUntil
      if (stale && waitUntil) {
        waitUntil(
          buildBoardPayload(event, user, new Date(), true)
            .then(body => persistBoard(store, user.login, body, Date.now()))
            .catch(error => {
              const message = error instanceof Error ? error.message : 'board refresh failed'
              console.warn(`board revalidate ${user.login}: ${message}`)
            }),
        )
      }
      return {
        ...cached,
        cached: true,
        revalidating: stale,
      }
    }
  }

  try {
    const body = await buildBoardPayload(event, user, now, refresh)
    await persistBoard(store, user.login, body, nowMs)
    return body
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub search failed'
    throw createError({ statusCode: 502, statusMessage: message })
  }
})

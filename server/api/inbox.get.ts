import { createError, getQuery } from 'h3'
import { workerEnv } from '../bindings'
import {
  INBOX_STALE_MS,
  loadInboxUnits,
  persistInbox,
  presentInbox,
  readInboxCache,
  type InboxPayload,
} from '../inbox-response'
import { MOCK_VIEWER, mockSeen, mockUnits } from '../mock'
import type { SessionUser } from '../session'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const now = new Date()
  const nowMs = now.getTime()
  const mock = import.meta.dev && (query.mock === '1' || process.env.OSDASH_MOCK === '1')
  if (mock) {
    const user: SessionUser = { login: MOCK_VIEWER, token: '', name: 'Octo Dev' }
    return presentInbox(
      undefined,
      user,
      {
        generatedAt: now.toISOString(),
        truncated: false,
        units: mockUnits(nowMs),
      },
      nowMs,
      { cached: false, mock: true },
      mockSeen(nowMs),
    )
  }

  const user = event.context.osdashUser
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })

  const refresh = query.refresh === '1'
  const store = workerEnv(event).CACHE

  if (!refresh) {
    const cached = await readInboxCache(store, user.login, nowMs)
    if (cached) {
      const stale = nowMs - Date.parse(cached.generatedAt) >= INBOX_STALE_MS
      const waitUntil = event.context.cloudflare?.context?.waitUntil
      if (stale && waitUntil) {
        waitUntil(
          loadInboxUnits(event, user, new Date(), true)
            .then(body => persistInbox(store, user.login, body, Date.now()))
            .catch(error => {
              const message = error instanceof Error ? error.message : 'inbox refresh failed'
              console.warn(`inbox revalidate ${user.login}: ${message}`)
            }),
        )
      }
      return presentInbox(store, user, cached, nowMs, {
        cached: true,
        revalidating: stale,
        mock: false,
      })
    }
  }

  try {
    const body = await loadInboxUnits(event, user, now, refresh)
    await persistInbox(store, user.login, body, nowMs)
    return presentInbox(store, user, body, nowMs, { cached: false, mock: false })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub search failed'
    throw createError({ statusCode: 502, statusMessage: message })
  }
})

export type { InboxPayload }

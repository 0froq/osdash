import { createError, getQuery } from 'h3'
import {
  INBOX_STALE_MS,
  loadInboxUnits,
  persistInbox,
  presentInbox,
  readInboxCache,
  type InboxPayload,
} from '../inbox-response'
import { MOCK_VIEWER, mockUnits } from '../mock'
import { devMock } from '../mock-state'
import { loadUnreadNotifications, type NotificationSnapshot } from '../notifications'
import type { SessionUser } from '../session'

const emptyNotes: NotificationSnapshot = { scope: true, threads: [] }

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const now = new Date()
  const nowMs = now.getTime()
  if (devMock(event)) {
    const user: SessionUser = { login: MOCK_VIEWER, token: '', name: 'Octo Dev' }
    return presentInbox(
      user,
      {
        generatedAt: now.toISOString(),
        truncated: false,
        units: mockUnits(nowMs),
      },
      { cached: false, mock: true },
      emptyNotes,
    )
  }

  const user = event.context.osdashUser
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })

  const refresh = query.refresh === '1'
  const snapshot = await loadUnreadNotifications(user.token, user.login, undefined, nowMs, refresh)

  if (!refresh) {
    const cached = await readInboxCache(undefined, user.login, nowMs)
    if (cached) {
      const stale = nowMs - Date.parse(cached.generatedAt) >= INBOX_STALE_MS
      if (stale) {
        const revalidate = loadInboxUnits(user, new Date())
          .then(body => persistInbox(undefined, user.login, body, Date.now()))
          .catch(error => {
            const message = error instanceof Error ? error.message : 'inbox refresh failed'
            console.warn(`inbox revalidate ${user.login}: ${message}`)
          })
        try {
          const ctx = event.context as typeof event.context & {
            waitUntil?: (promise: Promise<unknown>) => void
          }
          if (typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(revalidate)
          } else {
            event.context.cloudflare?.context?.waitUntil?.(revalidate)
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'waitUntil failed'
          console.warn(`inbox revalidate schedule ${user.login}: ${message}`)
        }
      }
      return presentInbox(
        user,
        cached,
        { cached: true, revalidating: stale, mock: false },
        snapshot,
      )
    }
  }

  try {
    const body = await loadInboxUnits(user, now)
    await persistInbox(undefined, user.login, body, nowMs)
    return presentInbox(user, body, { cached: false, mock: false }, snapshot)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub search failed'
    throw createError({ statusCode: 502, statusMessage: message })
  }
})

export type { InboxPayload }

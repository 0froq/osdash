import { getCookie, setCookie, deleteCookie, type H3Event } from 'h3'
import { SESSION_TTL_SECONDS } from './session-store'

export const SESSION_COOKIE = 'osdash_session'
export type { SessionUser } from './session-store'
export { createSession, readSession } from './session-store'

export function setSessionCookie(event: H3Event, sessionId: string): void {
  setCookie(event, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export function sessionIdFromEvent(event: H3Event): string | undefined {
  const value = getCookie(event, SESSION_COOKIE)
  return value && value.length > 0 ? value : undefined
}

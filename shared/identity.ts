import type { Actor } from './turn'

export const BOT_LOGINS = [
  'coderabbitai',
  'codecov',
  'netlify',
  'vercel',
  'coldtea-pr-lens',
  'chatgpt-codex-connector',
] as const

export function isBot(actor: Actor): boolean {
  if (actor.typename === 'Bot') return true
  if (actor.login.endsWith('[bot]')) return true
  const login = actor.login.toLowerCase()
  return BOT_LOGINS.some(name => name === login)
}

export function viewerLoginOf(item?: { viewerLogin?: string }): string {
  const login = item?.viewerLogin?.trim()
  if (!login) throw new Error('viewerLogin missing')
  return login.toLowerCase()
}

export function isSelf(actor: Actor, viewer: string): boolean {
  return actor.login.toLowerCase() === viewer.toLowerCase()
}

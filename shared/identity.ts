import type { Actor } from './turn'

export const SELF = '0froq'

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

export function isSelf(actor: Actor): boolean {
  return actor.login.toLowerCase() === SELF
}

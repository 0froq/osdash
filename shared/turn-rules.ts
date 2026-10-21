import { isClearHelpClosure, isHelpText } from './contribution'
import { isBot, isSelf } from './identity'
import { isMaintainerAssociation } from './claim-types'
import type { Activity, Actor } from './turn'

export function isPoliteCloser(body: string): boolean {
  const stripped = body
    .trim()
    .replace(/[.!]+$/g, '')
    .trim()
  return /^(thanks|thank you|thx|ty|cheers|much appreciated|appreciate it|thanks so much|thank you so much)$/i.test(
    stripped,
  )
}

export function isQuestionText(body: string): boolean {
  const lines = body
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  const last = lines.at(-1) ?? ''
  if (!last || isPoliteCloser(last)) return false
  return /\?\s*$/.test(last)
}

export function isStatementText(body: string): boolean {
  const text = body.trim()
  if (!text || isPoliteCloser(text) || isQuestionText(text)) return false
  return true
}

export function mentionsSelf(body: string, viewer = '0froq'): boolean {
  const escaped = viewer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|\\s)@${escaped}\\b`, 'i').test(body)
}

export function asksForPrOrRebase(body: string): boolean {
  return (
    /\brebase\b/i.test(body) ||
    /\b(?:open|send|submit)\s+(?:a\s+)?(?:pr|pull request)\b/i.test(body) ||
    /\bwaiting\s+on\s+(?:a\s+)?(?:pr|pull request)\b/i.test(body)
  )
}

function isClaBot(actor: Actor): boolean {
  const login = actor.login.toLowerCase()
  return (
    /^(?:google-)?cla(?:-assistant)?(?:\[bot\])?$/.test(login) ||
    login.includes('linux-foundation') ||
    login.includes('cla-assistant')
  )
}

export function isFailingClaComment(activity: Activity): boolean {
  if (!activity.body || !isBot(activity.actor) || !isClaBot(activity.actor)) return false
  return /not signed|need to sign|sign the cla|cla.*(fail|required|missing)|missing.*cla/i.test(
    activity.body,
  )
}

export function isCoderabbitActionable(activity: Activity): boolean {
  const login = activity.actor.login.toLowerCase().replace(/\[bot\]$/, '')
  if (login !== 'coderabbitai') return false
  if (activity.reviewState === 'CHANGES_REQUESTED') return true
  const body = activity.body ?? ''
  if (/```suggestion|potential issue|prompt for ai agents/i.test(body)) return true
  const posted = /actionable comments posted:\s*(\d+)/i.exec(body)
  return posted !== null && posted[1] !== '0'
}

export function isDroppedBot(activity: Activity): boolean {
  if (!isBot(activity.actor)) return false
  return !isFailingClaComment(activity) && !isCoderabbitActionable(activity)
}

export function isMaintainerActivity(activity: Activity, viewer = '0froq'): boolean {
  return isMaintainerAssociation(activity.authorAssociation) && !isSelf(activity.actor, viewer)
}

export function isUnclearHelp(body: string): boolean {
  const text = body.trim()
  if (!isHelpText(text) || isClearHelpClosure(text) || isQuestionText(text)) return false
  return text.length >= 280
}

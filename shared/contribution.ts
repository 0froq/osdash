import { isAskActivity, isClaimActivity } from './claim-classifier'
import { isSelf, viewerLoginOf } from './identity'
import type { Item, ItemPart } from './turn'

export type ContributionType = 'claim' | 'proposal' | 'help' | 'non-code'

const CONTRIBUTION_ORDER: readonly ContributionType[] = ['claim', 'proposal', 'help', 'non-code']

const HELP_PATTERNS: readonly RegExp[] = [
  /\broot cause\b/i,
  /\brepro(?:duce|duction)?\b/i,
  /\bsteps to reproduce\b/i,
  /\bworkaround\b/i,
  /\balready fixed\b/i,
  /\bcaused by\b/i,
  /\bstack trace\b/i,
  /\bthis happens when\b/i,
]

const PROPOSAL_PATTERNS: readonly RegExp[] = [
  /\bcan i (?:take|work|open|send|fix)\b/i,
  /\bmay i\b/i,
  /\bwould you (?:like|mind)\b/i,
  /\bis it (?:ok|okay) if i\b/i,
  /\bbefore i (?:open|start|claim|send)\b/i,
  /\bmind if i\b/i,
]

const NON_CODE_PATTERNS: readonly RegExp[] = [
  /\bthemes?\b/i,
  /\bnamespace\b/i,
  /\bdirectory listings?\b/i,
  /\blist(?:ing)? (?:the |a )?director(?:y|ies)\b/i,
]

export function isHelpText(body: string): boolean {
  const text = body.trim()
  if (text.length < 40) return false
  return HELP_PATTERNS.some(pattern => pattern.test(text))
}

export function isClearHelpClosure(body: string): boolean {
  return /\balready fixed\b/i.test(body) || /\bworkaround\b/i.test(body)
}

export function isProposalText(body: string): boolean {
  const text = body.trim()
  if (!text) return false
  return PROPOSAL_PATTERNS.some(pattern => pattern.test(text))
}

export function isNonCodeText(body: string): boolean {
  const text = body.trim()
  if (!text) return false
  return NON_CODE_PATTERNS.some(pattern => pattern.test(text))
}

function ownParts(item: Item): ItemPart[] {
  if (item.parts && item.parts.length > 0) return item.parts
  return [
    {
      kind: item.kind,
      repo: item.repo,
      number: item.number,
      url: item.url,
      title: item.title,
      authorLogin: item.author.login,
      body: item.body,
    },
  ]
}

function selfAuthored(login: string, viewer: string): boolean {
  return login.toLowerCase() === viewer.toLowerCase()
}

export function hasOpenedFix(item: Item): boolean {
  const viewer = viewerLoginOf(item)
  return ownParts(item).some(part => part.kind === 'pr' && selfAuthored(part.authorLogin, viewer))
}

export function contributionTypes(item: Item): ContributionType[] {
  const viewer = viewerLoginOf(item)
  const found = new Set<ContributionType>()
  if (hasOpenedFix(item)) found.add('claim')

  const texts: string[] = []
  for (const part of ownParts(item)) {
    if (!selfAuthored(part.authorLogin, viewer)) continue
    texts.push(part.title)
    if (part.body) texts.push(part.body)
  }
  for (const activity of item.activities) {
    if (!isSelf(activity.actor, viewer) || !activity.body) continue
    texts.push(activity.body)
    if (isClaimActivity(activity)) found.add('claim')
    if (isAskActivity(activity)) found.add('proposal')
  }

  for (const text of texts) {
    if (isProposalText(text)) found.add('proposal')
    if (isHelpText(text) || isClearHelpClosure(text)) found.add('help')
    if (isNonCodeText(text)) found.add('non-code')
  }

  return CONTRIBUTION_ORDER.filter(type => found.has(type))
}

export function contributionLabel(type: ContributionType): string {
  switch (type) {
    case 'claim':
      return 'Claim'
    case 'proposal':
      return 'Proposal'
    case 'help':
      return 'Help'
    case 'non-code':
      return 'Non-code'
    default: {
      const exhaustive: never = type
      return exhaustive
    }
  }
}

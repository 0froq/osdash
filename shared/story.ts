import type { TimelineEntry } from './events'
import type { ItemKind, ItemState } from './turn'
import type { Unit } from './unit'

/** `owner/repo#123`. Same key for issues and pull requests. */
export type StoryKey = string

export function storyKey(repo: string, number: number): StoryKey {
  return `${repo}#${number}`
}

/**
 * One issue or pull request that belongs to a card. Every field comes from
 * GraphQL data already on the Unit. Nothing is guessed.
 */
export type StoryItem = {
  key: StoryKey
  kind: ItemKind
  repo: string
  number: number
  title: string
  url: string
  state: ItemState
  authorLogin: string
  /** Null when the item is only known through closingIssuesReferences. */
  createdAt: string | null
  closedAt: string | null
  /** primary: the card. issue: a linked issue. history: an earlier viewer PR. fixed-by: someone else's PR. */
  role: 'primary' | 'issue' | 'history' | 'fixed-by'
  /** Issues only. closing = closingIssuesReferences or connected. mention = cross-referenced only. */
  link: 'closing' | 'mention' | null
  /** Pull requests only. Issue keys from this PR's own closingIssuesReferences and connected events. */
  closes: StoryKey[]
  /** Missing on older cached payloads. Inferred targets cannot drive a projected convergence. */
  closingEvidence?: 'explicit' | 'inferred'
}

export type TimelinePayload = {
  id: string
  generatedAt: string
  cached: boolean
  entries: TimelineEntry[]
  items: StoryItem[]
  truncated: boolean
}

export type StoryUnit = Pick<
  Unit,
  | 'repo'
  | 'number'
  | 'kind'
  | 'title'
  | 'url'
  | 'state'
  | 'createdAt'
  | 'closedAt'
  | 'issues'
  | 'history'
  | 'fixedBy'
  | 'members'
>

function memberOf(
  unit: StoryUnit,
  repo: string,
  number: number,
): StoryUnit['members'][number] | undefined {
  return unit.members.find(member => member.repo === repo && member.number === number)
}

export function storyItems(unit: StoryUnit): StoryItem[] {
  const primaryKey = storyKey(unit.repo, unit.number)
  const items: StoryItem[] = []
  const seen = new Set<StoryKey>()
  const push = (item: StoryItem): void => {
    if (seen.has(item.key)) return
    seen.add(item.key)
    items.push(item)
  }

  const primaryMember = memberOf(unit, unit.repo, unit.number)
  push({
    key: primaryKey,
    kind: unit.kind === 'issue-only' ? 'issue' : 'pr',
    repo: unit.repo,
    number: unit.number,
    title: unit.title,
    url: unit.url,
    state: unit.state,
    authorLogin: primaryMember?.authorLogin ?? '',
    createdAt: unit.createdAt,
    closedAt: unit.closedAt,
    role: 'primary',
    link: null,
    closes: primaryMember?.closes ?? [],
    closingEvidence: primaryMember?.closes ? 'explicit' : 'inferred',
  })

  const closingKeys = unit.issues
    .filter(issue => issue.link === 'closing')
    .map(issue => storyKey(issue.repo, issue.number))
  for (const old of unit.history) {
    const member = memberOf(unit, old.repo, old.number)
    push({
      key: storyKey(old.repo, old.number),
      kind: 'pr',
      repo: old.repo,
      number: old.number,
      title: old.title,
      url: old.url,
      state: 'closed',
      authorLogin: member?.authorLogin ?? '',
      createdAt: member?.createdAt ?? null,
      closedAt: old.closedAt,
      role: 'history',
      link: null,
      closes: member?.closes ?? closingKeys,
      closingEvidence: member?.closes ? 'explicit' : 'inferred',
    })
  }

  for (const issue of unit.issues) {
    const member = memberOf(unit, issue.repo, issue.number)
    push({
      key: storyKey(issue.repo, issue.number),
      kind: 'issue',
      repo: issue.repo,
      number: issue.number,
      title: issue.title,
      url: issue.url,
      state: issue.state,
      authorLogin: issue.authorLogin,
      createdAt: member?.createdAt ?? null,
      closedAt: member?.closedAt ?? null,
      role: 'issue',
      link: issue.link,
      closes: [],
    })
  }

  if (unit.fixedBy) {
    push({
      key: storyKey(unit.fixedBy.repo, unit.fixedBy.number),
      kind: 'pr',
      repo: unit.fixedBy.repo,
      number: unit.fixedBy.number,
      title: '',
      url: unit.fixedBy.url,
      state: unit.fixedBy.state,
      authorLogin: unit.fixedBy.authorLogin,
      createdAt: unit.fixedBy.createdAt ?? null,
      closedAt: null,
      role: 'fixed-by',
      link: null,
      closes: unit.fixedBy.closes,
      closingEvidence: 'explicit',
    })
  }

  return items
}

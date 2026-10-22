import type { ReasonCode } from './reason'
import type { BoardLabel, ContributionType, DerivedMark, ItemKind, ItemState, Tone } from './turn'

export type UnitKind = 'pr' | 'issue-only'

/** One sidebar category per card. */
export type UnitCategory = 'claimed-fix' | 'direct-pr' | 'reported' | 'helped'

export type UnitIssue = {
  repo: string
  number: number
  url: string
  title: string
  state: ItemState
  authorLogin: string
  /** closing = closingIssuesReferences or a connected event; mention = cross-referenced only. */
  link: 'closing' | 'mention'
  /** Other viewer pull requests that also reference this issue (split PRs). */
  sharedWith: Array<{ repo: string; number: number; url: string }>
}

export type UnitHistoryPr = {
  repo: string
  number: number
  url: string
  title: string
  state: 'closed'
  closedAt: string
}

export type Unit = {
  id: string
  kind: UnitKind
  category: UnitCategory
  tags: ContributionType[]
  repo: string
  number: number
  title: string
  url: string
  state: ItemState
  createdAt: string
  closedAt: string | null
  issues: UnitIssue[]
  history: UnitHistoryPr[]
  fixedBy: {
    repo: string
    number: number
    url: string
    authorLogin: string
    state: ItemState
  } | null
  myTurn: boolean
  ended: boolean
  reason: string
  reasonCode: ReasonCode
  reasonActor: string | null
  quote: string | null
  labels: BoardLabel[]
  marks: DerivedMark[]
  tone: Tone
  lastActivityAt: string
  lastOtherActivityAt: string | null
  ageMs: number
  firstReplyMs: number | null
  links: { item: string; comment: string | null; ci: string | null }
  members: Array<{
    repo: string
    number: number
    kind: ItemKind
    updatedAt?: string
    headSha?: string
  }>
}

/** Merged with per-user state on each GET. Not stored in the board cache. */
export type UnitView = Unit & {
  unread: boolean
  starred: boolean
  laterUntil: string | null
}

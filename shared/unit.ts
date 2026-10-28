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
    createdAt?: string
    /** Targets verified against the fixing PR's closingIssuesReferences. */
    closes: string[]
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
  /** Newest few beats, built once with the unit and cached with it. */
  beats: UnitBeat[]
  members: Array<{
    repo: string
    number: number
    kind: ItemKind
    updatedAt?: string
    headSha?: string
    title?: string
    url?: string
    state?: ItemState
    authorLogin?: string
    createdAt?: string
    closedAt?: string | null
    /** storyKey list of issues this item closes or is connected to. */
    closes?: string[]
  }>
}

/** Merged with per-user state on each GET. Not stored in the board cache. */
/** A note the viewer wrote on a card, placed on the story by time. */
export type UnitNote = {
  id: string
  /** Client-only file fingerprint captured when editing starts. */
  version?: string | null
  /** Client-only state. Cleared after the device acknowledges a save. */
  unsaved?: boolean
  /**
   * ISO time the note sits at. Notes ride between story events by this stamp,
   * so a note never depends on a row id that later data may drop.
   */
  anchor: string
  text: string
  at: string
}

/**
 * One recent beat of a card's story, small enough to sit on the card itself.
 * Built from the same activities the preview turns into rows, so the card never
 * shows something the preview would contradict.
 */
export type UnitBeat = {
  at: string
  actor: string
  /** Already phrased for display, e.g. "requested changes". */
  what: string
  /** Mirrors the preview rail's node vocabulary. */
  node: 'dot' | 'open' | 'minor' | 'merged' | 'closed'
  /** True when this beat is what asks something of the viewer. */
  wants: boolean
}

export type UnitView = Unit & {
  unread: boolean
  /** GitHub notification thread ids for this card's members. */
  notificationThreadIds: string[]
  notes: UnitNote[]
}

/** Unread first, then newest activity first within each read state. */
export function compareWaitingUnits(
  first: Pick<UnitView, 'unread' | 'ageMs'>,
  second: Pick<UnitView, 'unread' | 'ageMs'>,
): number {
  return Number(second.unread) - Number(first.unread) || first.ageMs - second.ageMs
}

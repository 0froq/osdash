import type { BoardLabel, ContributionType, DerivedMark, ItemState } from '#shared/turn'
import type { UnitCategory } from '#shared/unit'
import { copy } from '~/copy/zh-CN'

export function categoryLabel(category: UnitCategory): string {
  switch (category) {
    case 'claimed-fix':
      return copy.categories['claimed-fix']
    case 'direct-pr':
      return copy.categories['direct-pr']
    case 'reported':
      return copy.categories.reported
    case 'helped':
      return copy.categories.helped
    default: {
      const exhaustive: never = category
      return exhaustive
    }
  }
}

export function tagLabel(type: ContributionType): string {
  switch (type) {
    case 'claim':
      return copy.tags.claim
    case 'proposal':
      return copy.tags.proposal
    case 'help':
      return copy.tags.help
    case 'non-code':
      return copy.tags['non-code']
    default: {
      const exhaustive: never = type
      return exhaustive
    }
  }
}

export function markLabel(mark: DerivedMark): string {
  switch (mark) {
    case "said I'd do it but haven't":
      return copy.marks.claimed
    case 'stalled >14d':
      return copy.marks.stalled
    default: {
      const exhaustive: never = mark
      return exhaustive
    }
  }
}

export function boardLabel(label: BoardLabel): string {
  switch (label) {
    case 'CI awaiting approval':
      return copy.labels.ciApproval
    case 'Self-claimed':
      return copy.labels.selfClaimed
    default: {
      const exhaustive: never = label
      return exhaustive
    }
  }
}

export function stateLabel(state: ItemState): string {
  switch (state) {
    case 'open':
      return copy.states.open
    case 'closed':
      return copy.states.closed
    case 'merged':
      return copy.states.merged
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

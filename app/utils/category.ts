import type { BoardLabel, ContributionType, DerivedMark, ItemState } from '#shared/turn'
import type { UnitCategory } from '#shared/unit'
import type { TFunc } from '#shared/i18n'

export function categoryLabel(t: TFunc, category: UnitCategory): string {
  switch (category) {
    case 'claimed-fix':
      return t('categories.claimed-fix')
    case 'direct-pr':
      return t('categories.direct-pr')
    case 'reported':
      return t('categories.reported')
    case 'helped':
      return t('categories.helped')
    default: {
      const exhaustive: never = category
      return exhaustive
    }
  }
}

export function tagLabel(t: TFunc, type: ContributionType): string {
  switch (type) {
    case 'claim':
      return t('tags.claim')
    case 'proposal':
      return t('tags.proposal')
    case 'help':
      return t('tags.help')
    case 'non-code':
      return t('tags.non-code')
    default: {
      const exhaustive: never = type
      return exhaustive
    }
  }
}

export function markLabel(t: TFunc, mark: DerivedMark): string {
  switch (mark) {
    case "said I'd do it but haven't":
      return t('marks.claimed')
    case 'stalled >14d':
      return t('marks.stalled')
    default: {
      const exhaustive: never = mark
      return exhaustive
    }
  }
}

export function boardLabel(t: TFunc, label: BoardLabel): string {
  switch (label) {
    case 'CI awaiting approval':
      return t('labels.ciApproval')
    case 'Self-claimed':
      return t('labels.selfClaimed')
    default: {
      const exhaustive: never = label
      return exhaustive
    }
  }
}

export function stateLabel(t: TFunc, state: ItemState): string {
  switch (state) {
    case 'open':
      return t('states.open')
    case 'closed':
      return t('states.closed')
    case 'merged':
      return t('states.merged')
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

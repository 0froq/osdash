import { estimateStateTokens } from './claim-classifier'
import { isDroppedBot, isPoliteCloser } from './turn-rules'
import { DAY_MS, type Activity, type Item, type Turn } from './turn'

export const TURN_CONFIDENCE = 0.7

export type TurnName = Turn

export type TurnModelResult = {
  turn: Turn
  confidence: number
  quote: string | null
}

const TURNS: readonly Turn[] = ['mine', 'maintainer', 'other', 'none']

export function isTurnName(value: string): value is Turn {
  return (TURNS as readonly string[]).includes(value)
}

export function turnCacheKey(commentId: string, updatedAt: string): string {
  return `turn-clf:v1:${commentId}:${updatedAt}`
}

export function humanComments(activities: readonly Activity[]): Activity[] {
  return activities
    .filter(
      activity =>
        (activity.kind === 'comment' || activity.kind === 'review') && !isDroppedBot(activity),
    )
    .sort((first, second) => Date.parse(first.at) - Date.parse(second.at))
}

export function sentencesOf(body: string): string[] {
  return body
    .split(/(?<=[.!?])\s+|\n+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)
    .slice(0, 6)
}

export function buildTurnState(
  item: Item,
  activities: readonly Activity[],
  ageMs: number,
): {
  state: Record<string, unknown>
  sentences: string[]
} {
  const comments = humanComments(activities).slice(-3)
  const sentences = comments.flatMap(activity => sentencesOf(activity.body ?? '')).slice(0, 8)
  const linkedPull = item.parts?.find(part => part.kind === 'pr')
  const linked =
    item.kind === 'pr' || linkedPull ? item.state : (item.linkedPullRequests?.[0]?.state ?? null)

  const state = {
    last_human_comments: comments.map(activity => ({
      author: activity.actor.login,
      author_association: activity.authorAssociation ?? null,
      body: activity.body ?? '',
      at: activity.at,
    })),
    linked_pr_state: linked,
    days_since_activity: Math.floor(ageMs / DAY_MS),
    note: 'A polite closer such as "Thanks!" does not by itself move the turn.',
  }

  return { state, sentences }
}

export function estimateTurnTokens(state: unknown): number {
  return estimateStateTokens(state)
}

export function applyModelTurn(
  fallback: Turn,
  result: TurnModelResult,
): { turn: Turn; quote: string | null; usedModel: boolean } {
  if (!isTurnName(result.turn)) return { turn: fallback, quote: null, usedModel: false }
  if (result.confidence < TURN_CONFIDENCE) return { turn: fallback, quote: null, usedModel: false }
  if (!result.quote || isPoliteCloser(result.quote)) {
    return { turn: fallback, quote: null, usedModel: false }
  }
  return { turn: result.turn, quote: result.quote, usedModel: true }
}

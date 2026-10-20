import type { Activity, Item } from './turn'
import { isSelf } from './identity'
import { classifyIntentKeyword } from './claim-keywords'
import type { ClaimIntent, CommentClassification, ClassificationSource } from './claim-types'
import { INTENT_CONFIRM_THRESHOLD, MAINTAINER_OK_THRESHOLD } from './claim-types'

export type ClaimClassifierContext = {
  issueTitle: string
  comment: Activity
  thread: Activity[]
  role: 'self' | 'maintainer'
}

export interface ClaimCommentClassifier {
  classify(context: ClaimClassifierContext): Promise<CommentClassification>
}

export const CLEF_MAX_PRIOR_COMMENTS = 5
export const CLEF_MAX_COMMENT_BODY_CHARS = 500
export const CLEF_MAX_STATE_TOKEN_ESTIMATE = 3000
export const CLEF_CHARS_PER_TOKEN_ESTIMATE = 4

export function estimateStateTokens(state: unknown): number {
  return Math.ceil(JSON.stringify(state).length / CLEF_CHARS_PER_TOKEN_ESTIMATE)
}

function truncateBody(body: string, maxChars: number): string {
  if (body.length <= maxChars) return body
  return body.slice(0, maxChars)
}

function isFocusComment(context: ClaimClassifierContext, activity: Activity): boolean {
  if (context.comment.commentId && activity.commentId) {
    return activity.commentId === context.comment.commentId
  }
  return (
    activity.at === context.comment.at &&
    activity.actor.login === context.comment.actor.login &&
    activity.body === context.comment.body
  )
}

export function threadComments(activities: Activity[]): Activity[] {
  return activities
    .filter(activity => activity.kind === 'comment')
    .sort((first, second) => Date.parse(first.at) - Date.parse(second.at))
}

export function buildClassifierState(context: ClaimClassifierContext): Record<string, unknown> {
  const focusAt = Date.parse(context.comment.at)
  const prior = threadComments(context.thread)
    .filter(activity => !isFocusComment(context, activity) && Date.parse(activity.at) < focusAt)
    .slice(-CLEF_MAX_PRIOR_COMMENTS)
    .map(activity => ({
      at: activity.at,
      author: activity.actor.login,
      author_association: activity.authorAssociation ?? null,
      body: truncateBody(activity.body ?? '', CLEF_MAX_COMMENT_BODY_CHARS),
    }))

  let focusBody = context.comment.body ?? ''
  let priorComments = prior

  const build = (): Record<string, unknown> => ({
    issue_title: context.issueTitle,
    focus_comment: {
      author: context.comment.actor.login,
      author_association: context.comment.authorAssociation ?? null,
      body: focusBody,
      role: context.role,
    },
    prior_comments: priorComments,
  })

  let state = build()
  while (estimateStateTokens(state) > CLEF_MAX_STATE_TOKEN_ESTIMATE && priorComments.length > 0) {
    priorComments = priorComments.slice(1)
    state = build()
  }
  while (estimateStateTokens(state) > CLEF_MAX_STATE_TOKEN_ESTIMATE && focusBody.length > 0) {
    focusBody = truncateBody(focusBody, focusBody.length - CLEF_MAX_COMMENT_BODY_CHARS)
    state = build()
  }

  return state
}

export function effectiveClassification(activity: Activity): CommentClassification {
  if (activity.classification) return activity.classification
  if (!activity.body) {
    return { intent: 'none', intentConfidence: 1, source: 'keyword' }
  }
  const keyword = classifyIntentKeyword(activity.body)
  return { ...keyword, source: 'keyword' }
}

export function claimingIntent(activity: Activity): ClaimIntent {
  const { intent, intentConfidence } = effectiveClassification(activity)
  if (intent === 'none' || intent === 'withdraw') return intent
  if (intentConfidence < 0.5) return 'none'
  return intent
}

export function canConfirmClaim(activity: Activity): boolean {
  const { intent, intentConfidence } = effectiveClassification(activity)
  return intent === 'claim' && intentConfidence >= INTENT_CONFIRM_THRESHOLD
}

export function isWithdrawActivity(activity: Activity): boolean {
  const { intent, intentConfidence } = effectiveClassification(activity)
  return intent === 'withdraw' && intentConfidence >= INTENT_CONFIRM_THRESHOLD
}

export function isAskActivity(activity: Activity): boolean {
  return claimingIntent(activity) === 'ask'
}

export function isClaimActivity(activity: Activity): boolean {
  return claimingIntent(activity) === 'claim'
}

export function maintainerApproved(activity: Activity): boolean {
  const classification = effectiveClassification(activity)
  if (classification.maintainerOk !== undefined) {
    return classification.maintainerOk >= MAINTAINER_OK_THRESHOLD
  }
  return false
}

export function mergeClassification(
  partial: Partial<CommentClassification> &
    Pick<CommentClassification, 'intent' | 'intentConfidence' | 'source'>,
): CommentClassification {
  return {
    intent: partial.intent,
    intentConfidence: partial.intentConfidence,
    maintainerOk: partial.maintainerOk,
    source: partial.source,
  }
}

export function cacheKeyForComment(commentId: string, updatedAt: string): string {
  return `claim-clf:v1:${commentId}:${updatedAt}`
}

export function shouldClassifyMaintainerComment(item: Item, comment: Activity): boolean {
  const moment = Date.parse(comment.at)
  return threadComments(item.activities).some(
    activity => isSelf(activity.actor) && isClaimOrAskBefore(activity, moment),
  )
}

function isClaimOrAskBefore(activity: Activity, moment: number): boolean {
  if (Date.parse(activity.at) >= moment) return false
  const intent = claimingIntent(activity)
  return intent === 'claim' || intent === 'ask'
}

export function attachClassification(
  activity: Activity,
  classification: CommentClassification,
  source: ClassificationSource,
): void {
  activity.classification = { ...classification, source }
}

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

export function threadComments(activities: Activity[]): Activity[] {
  return activities
    .filter(activity => activity.kind === 'comment')
    .sort((first, second) => Date.parse(first.at) - Date.parse(second.at))
}

export function buildClassifierState(context: ClaimClassifierContext): Record<string, unknown> {
  const comments = threadComments(context.thread).map(activity => ({
    at: activity.at,
    author: activity.actor.login,
    author_association: activity.authorAssociation ?? null,
    body: activity.body ?? '',
    focus: activity.commentId === context.comment.commentId,
  }))
  return {
    issue_title: context.issueTitle,
    focus_comment: {
      author: context.comment.actor.login,
      author_association: context.comment.authorAssociation ?? null,
      body: context.comment.body ?? '',
      role: context.role,
    },
    comments,
  }
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

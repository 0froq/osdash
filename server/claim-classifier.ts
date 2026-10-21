import { readCache, writeCache, type CacheStore } from './cache'
import { createClefClaimClassifier, type AiBinding } from './claim-classifier-clef'
import {
  attachClassification,
  cacheKeyForComment,
  type ClaimClassifierContext,
  type ClaimCommentClassifier,
  shouldClassifyMaintainerComment,
} from '../shared/claim-classifier'
import type { CommentClassification } from '../shared/claim-types'
import { isSelf, viewerLoginOf } from '../shared/identity'
import { clefEnabledForUser, usesWorkersAiClef, type ByokSettings } from './byok'
import { isMaintainerAssociation } from '../shared/claim-types'
import type { Item } from '../shared/turn'

const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60

export type ClaimClassifierEnv = {
  AI?: AiBinding
  CACHE?: CacheStore
  viewerLogin?: string
  byok?: ByokSettings | null
  clefLogins?: readonly string[]
}

export function createCachingClaimClassifier(
  env: ClaimClassifierEnv,
  nowMs: number,
): ClaimCommentClassifier {
  const viewerLogin = env.viewerLogin
  if (!viewerLogin) throw new Error('viewerLogin missing')
  const allowList = env.clefLogins ?? []
  const inner = createClefClaimClassifier(
    clefEnabledForUser(viewerLogin, env.byok ?? null, allowList) &&
      usesWorkersAiClef(viewerLogin, allowList)
      ? env.AI
      : undefined,
  )

  return {
    async classify(context: ClaimClassifierContext): Promise<CommentClassification> {
      const commentId = context.comment.commentId
      const updatedAt = context.comment.updatedAt ?? context.comment.at
      if (commentId) {
        const key = cacheKeyForComment(commentId, updatedAt, viewerLogin)
        const hit = await readCache(env.CACHE, key, nowMs)
        if (hit) {
          const parsed = JSON.parse(hit) as CommentClassification
          return { ...parsed, source: 'cache' }
        }
        const fresh = await inner.classify(context)
        await writeCache(env.CACHE, key, JSON.stringify(fresh), CACHE_TTL_SECONDS, nowMs)
        return fresh
      }
      return inner.classify(context)
    },
  }
}

export async function enrichIssueClassifications(
  items: Item[],
  classifier: ClaimCommentClassifier,
): Promise<void> {
  for (const item of items) {
    if (item.kind !== 'issue') continue
    const viewer = viewerLoginOf(item)
    for (const activity of item.activities) {
      if (activity.kind !== 'comment' || !activity.body) continue
      let role: ClaimClassifierContext['role'] | null = null
      if (isSelf(activity.actor, viewer)) role = 'self'
      else if (
        isMaintainerAssociation(activity.authorAssociation) &&
        shouldClassifyMaintainerComment(item, activity)
      )
        role = 'maintainer'
      if (!role) continue

      const classification = await classifier.classify({
        issueTitle: item.title,
        comment: activity,
        thread: item.activities,
        role,
      })
      attachClassification(activity, classification, classification.source)
    }
  }
}

export async function enrichIssueClassificationsForEnv(
  items: Item[],
  env: ClaimClassifierEnv,
  nowMs: number,
): Promise<void> {
  const classifier = createCachingClaimClassifier(env, nowMs)
  await enrichIssueClassifications(items, classifier)
}

import {
  buildClassifierState,
  estimateStateTokens,
  type ClaimClassifierContext,
  type ClaimCommentClassifier,
  mergeClassification,
} from '../shared/claim-classifier'
import { classifyIntentKeyword } from '../shared/claim-keywords'
import type { ClaimIntent, CommentClassification } from '../shared/claim-types'
import { CLEF_MODEL } from '../shared/claim-types'

export type AiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>
}

const INTENT_CRITERIA: Record<ClaimIntent, string> = {
  claim: 'Commits to open or send a PR, or to work on a fix for this issue',
  ask: 'Asks whether they may take or work on this issue',
  withdraw: 'Hands the issue back, unassigns themselves, or tells others to go ahead without them',
  none: 'Unrelated to claiming or taking this issue',
}

function parseChoice(raw: unknown): { intent: ClaimIntent; intentConfidence: number } {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid clef choice response')
  const record = raw as Record<string, unknown>
  if (typeof record.probability === 'number' && typeof record.choice === 'string') {
    return { intent: record.choice as ClaimIntent, intentConfidence: record.probability }
  }
  const probabilities = record.probabilities
  if (probabilities && typeof probabilities === 'object') {
    const ranked = Object.entries(probabilities as Record<string, number>)
      .filter(([, value]) => typeof value === 'number')
      .sort((first, second) => second[1] - first[1])
    const top = ranked[0]
    if (!top) throw new Error('Empty clef choice response')
    return { intent: top[0] as ClaimIntent, intentConfidence: top[1] }
  }
  const ranked = Object.entries(record)
    .filter(([key, value]) => key in INTENT_CRITERIA && typeof value === 'number')
    .sort((first, second) => (second[1] as number) - (first[1] as number))
  const top = ranked[0]
  if (!top) throw new Error('Unrecognized clef choice response')
  return { intent: top[0] as ClaimIntent, intentConfidence: top[1] as number }
}

function parseNoul(raw: unknown): number {
  if (typeof raw === 'number') return raw
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>
    if (typeof record.probability === 'number') return record.probability
    if (typeof record.value === 'number') return record.value
  }
  throw new Error('Invalid clef noul response')
}

function logModelCall(
  context: ClaimClassifierContext,
  inputTokens: number,
  result: { intent: string; confidence: number },
): void {
  const commentId = context.comment.commentId ?? 'unknown'
  console.log(
    `claim-classify commentId=${commentId} role=${context.role} inputTokens=${inputTokens} intent=${result.intent} confidence=${result.confidence}`,
  )
}

function keywordFallback(context: ClaimClassifierContext): CommentClassification {
  const body = context.comment.body ?? ''
  if (context.role === 'maintainer') {
    return mergeClassification({
      intent: 'none',
      intentConfidence: 1,
      maintainerOk: undefined,
      source: 'keyword',
    })
  }
  const keyword = classifyIntentKeyword(body)
  return mergeClassification({ ...keyword, source: 'keyword' })
}

export function createClefClaimClassifier(ai: AiBinding | undefined): ClaimCommentClassifier {
  return {
    async classify(context: ClaimClassifierContext): Promise<CommentClassification> {
      if (!ai || !context.comment.body) return keywordFallback(context)

      const state = buildClassifierState(context)
      const inputTokens = estimateStateTokens(state)
      try {
        if (context.role === 'self') {
          const response = await ai.run(CLEF_MODEL, {
            model: 'clef-flash',
            state,
            questions: {
              intent: {
                type: 'choice',
                instructions:
                  'Classify the focus comment by whether the author is claiming the issue, asking to take it, withdrawing, or unrelated.',
                criteria: INTENT_CRITERIA,
              },
            },
          })
          const answers = (response as { answers?: Record<string, unknown> })?.answers
          const parsed = parseChoice(answers?.intent)
          logModelCall(context, inputTokens, {
            intent: parsed.intent,
            confidence: parsed.intentConfidence,
          })
          return mergeClassification({ ...parsed, source: 'ai' })
        }

        const response = await ai.run(CLEF_MODEL, {
          model: 'clef-flash',
          state,
          questions: {
            maintainer_ok: {
              type: 'noul',
              instructions:
                'Does this maintainer reply approve the contributor taking the issue and opening a pull request?',
            },
          },
        })
        const answers = (response as { answers?: Record<string, unknown> })?.answers
        const maintainerOk = parseNoul(answers?.maintainer_ok)
        logModelCall(context, inputTokens, {
          intent: 'maintainer_ok',
          confidence: maintainerOk,
        })
        return mergeClassification({
          intent: 'none',
          intentConfidence: 1,
          maintainerOk,
          source: 'ai',
        })
      } catch {
        return keywordFallback(context)
      }
    },
  }
}

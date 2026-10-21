import { readCache, writeCache, type CacheStore } from './cache'
import { clefEnabledForUser, usesWorkersAiClef, type ByokSettings } from './byok'
import { classifyTurnWithByok } from './clef-openai'
import type { AiBinding } from './claim-classifier-clef'
import { CLEF_MODEL } from '../shared/claim-types'
import {
  applyModelTurn,
  buildTurnState,
  estimateTurnTokens,
  isTurnName,
  turnCacheKey,
  type TurnModelResult,
} from '../shared/turn-classifier'
import { withResolvedTurn, type Item, type Verdict } from '../shared/turn'

const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60

export type TurnClassifierEnv = {
  AI?: AiBinding
  CACHE?: CacheStore
  viewerLogin?: string
  byok?: ByokSettings | null
}

type ChoiceAnswer = {
  choice?: string
  probability?: number
  confidence?: number
  probabilities?: Record<string, number>
}

function confidenceOf(answer: ChoiceAnswer, choice: string): number {
  if (typeof answer.confidence === 'number') return answer.confidence
  if (typeof answer.probability === 'number') return answer.probability
  const fromMap = answer.probabilities?.[choice]
  if (typeof fromMap === 'number') return fromMap
  return 0
}

function readChoice(raw: unknown): { choice: string; confidence: number } | null {
  if (!raw || typeof raw !== 'object') return null
  const answer = raw as ChoiceAnswer
  if (typeof answer.choice === 'string') {
    return { choice: answer.choice, confidence: confidenceOf(answer, answer.choice) }
  }
  if (answer.probabilities && typeof answer.probabilities === 'object') {
    const ranked = Object.entries(answer.probabilities)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
      .sort((first, second) => second[1] - first[1])
    const top = ranked[0]
    if (!top) return null
    return { choice: top[0], confidence: top[1] }
  }
  return null
}

function quoteFromChoice(choice: string, sentences: readonly string[]): string | null {
  const indexed = /^s(\d+)$/.exec(choice)
  if (indexed) {
    const sentence = sentences[Number(indexed[1])]
    return sentence ?? null
  }
  return sentences.find(sentence => sentence === choice) ?? null
}

async function askClefWorkers(
  ai: AiBinding,
  item: Item,
  verdict: Verdict,
  viewerLogin: string,
): Promise<TurnModelResult | null> {
  const { state, sentences } = buildTurnState(item, item.activities, verdict.ageMs)
  if (sentences.length === 0) return null
  const criteria: Record<string, string> = {}
  sentences.forEach((sentence, index) => {
    criteria[`s${index}`] = sentence
  })
  const response = await ai.run(CLEF_MODEL, {
    model: 'clef-flash',
    state,
    questions: {
      turn: {
        type: 'choice',
        instructions: `Whose turn is it for ${viewerLogin}? Answer exactly one of mine, maintainer, other, or none. A polite closer such as "Thanks!" does not move the turn by itself.`,
        criteria: {
          mine: `${viewerLogin} should act next`,
          maintainer: 'A maintainer (OWNER, MEMBER, or COLLABORATOR) should act next',
          other: `Someone who is not ${viewerLogin} and not a maintainer should act next`,
          none: 'Nothing is left to do',
        },
      },
      relied_on: {
        type: 'choice',
        instructions:
          'Which sentence did you rely on? Do not choose a polite closer such as "Thanks!" when another sentence decides the turn.',
        criteria,
      },
    },
  })
  const answers = (response as { answers?: Record<string, unknown> } | null)?.answers
  const turn = readChoice(answers?.turn)
  const relied = readChoice(answers?.relied_on)
  if (!turn || !isTurnName(turn.choice)) return null
  const quote = relied ? quoteFromChoice(relied.choice, sentences) : null
  console.log(
    `turn-classify commentId=${verdict.focusCommentId ?? 'unknown'} inputTokens=${estimateTurnTokens(state)} turn=${turn.choice} confidence=${turn.confidence}`,
  )
  return { turn: turn.choice, confidence: turn.confidence, quote }
}

export async function maybeClassifyTurn<T extends Verdict>(
  item: Item,
  verdict: T,
  env: TurnClassifierEnv,
  nowMs: number,
  fresh = false,
): Promise<T> {
  const viewerLogin = env.viewerLogin ?? item.viewerLogin ?? '0froq'
  const byok = env.byok ?? null
  if (!verdict.ambiguous || !clefEnabledForUser(viewerLogin, byok)) return verdict

  const commentId = verdict.focusCommentId
  const updatedAt = verdict.focusUpdatedAt
  const key = commentId && updatedAt ? turnCacheKey(commentId, updatedAt, viewerLogin) : null

  const apply = (result: TurnModelResult): T => {
    const decision = applyModelTurn(verdict.turn, result)
    if (!decision.usedModel) return verdict
    return withResolvedTurn(item, verdict, decision.turn, decision.quote)
  }

  if (key && !fresh) {
    const hit = await readCache(env.CACHE, key, nowMs)
    if (hit) return apply(JSON.parse(hit) as TurnModelResult)
  }

  try {
    let result: TurnModelResult | null = null
    if (usesWorkersAiClef(viewerLogin) && env.AI) {
      result = await askClefWorkers(env.AI, item, verdict, viewerLogin)
    } else if (byok) {
      result = await classifyTurnWithByok(byok, item, verdict, viewerLogin)
    }
    if (!result) return verdict
    if (key) await writeCache(env.CACHE, key, JSON.stringify(result), CACHE_TTL_SECONDS, nowMs)
    return apply(result)
  } catch {
    return verdict
  }
}

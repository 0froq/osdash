import {
  buildTurnState,
  estimateTurnTokens,
  isTurnName,
  type TurnModelResult,
} from '../shared/turn-classifier'
import type { ByokSettings } from './byok'
import type { Item, Verdict } from '../shared/turn'

function trimBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

async function chatCompletion(
  settings: ByokSettings,
  system: string,
  user: string,
): Promise<string> {
  const response = await fetch(`${trimBaseUrl(settings.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`BYOK chat failed: HTTP ${response.status}`)
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('BYOK chat returned no content')
  return content.trim()
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw)
  const text = fenced?.[1]?.trim() ?? raw.trim()
  try {
    const parsed = JSON.parse(text) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export async function classifyTurnWithByok(
  settings: ByokSettings,
  item: Item,
  verdict: Verdict,
  viewerLogin: string,
): Promise<TurnModelResult | null> {
  const { state, sentences } = buildTurnState(item, item.activities, verdict.ageMs)
  if (sentences.length === 0) return null

  const system = [
    'You classify whose turn it is on a GitHub issue or pull request.',
    `The viewer login is ${viewerLogin}.`,
    'Answer with JSON only: {"turn":"mine|maintainer|other|none","relied_on":"s0|s1|..."}',
    'mine means the viewer should act next.',
    'maintainer means a repo OWNER, MEMBER, or COLLABORATOR should act next.',
    'other means someone else should act next.',
    'none means nothing is left to do.',
    'Do not pick a polite closer such as "Thanks!" when another sentence decides the turn.',
  ].join(' ')

  const user = `${state}\n\nSentences:\n${sentences.map((s, i) => `s${i}: ${s}`).join('\n')}`

  const raw = await chatCompletion(settings, system, user)
  const parsed = parseJsonObject(raw)
  if (!parsed) return null
  const turn = typeof parsed.turn === 'string' ? parsed.turn : null
  const relied = typeof parsed.relied_on === 'string' ? parsed.relied_on : null
  if (!turn || !isTurnName(turn)) return null
  const indexed = relied ? /^s(\d+)$/.exec(relied) : null
  const quote = indexed ? (sentences[Number(indexed[1])] ?? null) : null
  console.log(
    `turn-classify-byok commentId=${verdict.focusCommentId ?? 'unknown'} inputTokens=${estimateTurnTokens(state)} turn=${turn}`,
  )
  return { turn, confidence: 0.85, quote }
}

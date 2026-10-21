import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { applyModelTurn, turnCacheKey } from './turn-classifier'

it('caches a turn decision by the last human comment id and updatedAt', () => {
  assert.equal(
    turnCacheKey('IC_1', '2026-10-19T00:00:00.000Z'),
    'turn-clf:v1:IC_1:2026-10-19T00:00:00.000Z',
  )
})

it('keeps the rule default when clef is unsure or quotes a polite closer', () => {
  const low = applyModelTurn('maintainer', {
    turn: 'mine',
    confidence: 0.42,
    quote: 'I traced this to the cache key.',
  })
  assert.equal(low.usedModel, false)
  assert.equal(low.turn, 'maintainer')
  assert.equal(low.quote, null)

  const thanks = applyModelTurn('maintainer', {
    turn: 'none',
    confidence: 0.93,
    quote: 'Thanks!',
  })
  assert.equal(thanks.usedModel, false)
  assert.equal(thanks.turn, 'maintainer')

  const used = applyModelTurn('maintainer', {
    turn: 'other',
    confidence: 0.88,
    quote: 'I traced this to the cache key.',
  })
  assert.equal(used.usedModel, true)
  assert.equal(used.turn, 'other')
  assert.equal(used.quote, 'I traced this to the cache key.')
})

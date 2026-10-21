import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { boardSearchQueries } from './github'

it('builds per-user GitHub search queries', () => {
  const queries = boardSearchQueries('alice', '2026-10-01')
  assert.equal(queries.length, 5)
  for (const query of queries) {
    assert.match(query, /alice/)
    assert.doesNotMatch(query, /0froq/)
  }
})

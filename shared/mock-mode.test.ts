import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { isMockEnabled, withMockQuery } from './mock-mode'

it('keeps mock off outside import.meta.dev', () => {
  assert.equal(isMockEnabled({ dev: false, queryMock: '1', envMock: '1' }), false)
})

it('keeps mock off in dev without query or env', () => {
  assert.equal(isMockEnabled({ dev: true, queryMock: undefined, envMock: undefined }), false)
  assert.equal(isMockEnabled({ dev: true, queryMock: 'true', envMock: 'true' }), false)
})

it('enables mock from ?mock=1 or OSDASH_MOCK=1', () => {
  assert.equal(isMockEnabled({ dev: true, queryMock: '1', envMock: undefined }), true)
  assert.equal(isMockEnabled({ dev: true, queryMock: ['1'], envMock: undefined }), true)
  assert.equal(isMockEnabled({ dev: true, queryMock: undefined, envMock: '1' }), true)
})

it('appends mock=1 only when mock mode is on', () => {
  assert.equal(withMockQuery('/api/seen', false), '/api/seen')
  assert.equal(withMockQuery('/api/seen', true), '/api/seen?mock=1')
  assert.equal(withMockQuery('/api/timeline?id=pr:1', true), '/api/timeline?id=pr:1&mock=1')
})

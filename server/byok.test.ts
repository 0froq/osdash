import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import {
  clefEnabledForUser,
  encodeByokHeader,
  parseByokHeader,
  parseClefLogins,
  usesWorkersAiClef,
} from './byok'

it('gives Workers AI clef to nobody when the allow list is empty', () => {
  const allow: readonly string[] = []
  assert.equal(usesWorkersAiClef('0froq', allow), false)
  assert.equal(clefEnabledForUser('alice', null, allow), false)
})

it('matches a comma-separated clef allow list after trim and lowercasing', () => {
  const allow = parseClefLogins('0froq, Foo ')
  assert.equal(usesWorkersAiClef('foo', allow), true)
  assert.equal(
    clefEnabledForUser(
      'alice',
      { baseUrl: 'https://api.example.com/v1', apiKey: 'k', model: 'm' },
      allow,
    ),
    true,
  )
})

it('reads a BYOK header and rejects anything that is not a complete key', () => {
  const header = encodeByokHeader({
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-test',
    model: 'gpt-4o-mini',
  })
  assert.equal(parseByokHeader(header)?.model, 'gpt-4o-mini')
  assert.equal(parseByokHeader('not-json'), null)
  assert.equal(parseByokHeader(undefined), null)
  assert.equal(parseByokHeader('x'.repeat(9000)), null)
})

import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import type { CacheStore } from './cache'
import { clefEnabledForUser, parseClefLogins, readByok, usesWorkersAiClef, writeByok } from './byok'

const SECRET = 'byok-secret-for-tests'

function memoryStore(): CacheStore {
  const data = new Map<string, string>()
  return {
    async get(key) {
      return data.get(key) ?? null
    },
    async put(key, value) {
      if (value === '') data.delete(key)
      else data.set(key, value)
    },
  }
}

it('gives Workers AI clef to nobody when the allow list is empty', () => {
  const allow: readonly string[] = []
  assert.equal(usesWorkersAiClef('0froq', allow), false)
  assert.equal(usesWorkersAiClef('alice', allow), false)
  assert.equal(clefEnabledForUser('0froq', null, allow), false)
  assert.equal(clefEnabledForUser('alice', null, allow), false)
})

it('matches a comma-separated clef allow list after trim and lowercasing', () => {
  const allow = parseClefLogins('0froq, Foo ')
  assert.equal(usesWorkersAiClef('foo', allow), true)
  assert.equal(usesWorkersAiClef('Foo', allow), true)
  assert.equal(usesWorkersAiClef('0froq', allow), true)
  assert.equal(usesWorkersAiClef('alice', allow), false)
  assert.equal(clefEnabledForUser('foo', null, allow), true)
  assert.equal(
    clefEnabledForUser(
      'alice',
      { baseUrl: 'https://api.example.com/v1', apiKey: 'k', model: 'm' },
      allow,
    ),
    true,
  )
})

it('stores BYOK settings per login in KV', async () => {
  const store = memoryStore()
  await writeByok(store, SECRET, 'alice', {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-test',
    model: 'gpt-4o-mini',
  })
  const alice = await readByok(store, SECRET, 'alice')
  assert.equal(alice?.model, 'gpt-4o-mini')
  assert.equal(await readByok(store, SECRET, 'bob'), null)
})

import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { createSession, readSession } from './session-store'

const SECRET = 'session-secret-for-tests'

it('seals the session into the cookie and isolates users', async () => {
  const aliceSeal = await createSession(SECRET, { login: 'alice', token: 'token-a' })
  const bobSeal = await createSession(SECRET, { login: 'bob', token: 'token-b' })

  assert.deepEqual(await readSession(SECRET, aliceSeal), { login: 'alice', token: 'token-a' })
  assert.deepEqual(await readSession(SECRET, bobSeal), { login: 'bob', token: 'token-b' })
  assert.equal(await readSession('other-secret', aliceSeal), null)
  assert.equal(await readSession(SECRET, 'not-a-session'), null)
})

it('round-trips name, avatar and numeric id', async () => {
  const sealed = await createSession(SECRET, {
    id: '123',
    login: 'alice',
    token: 'token-a',
    name: 'Alice',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
  })
  const user = await readSession(SECRET, sealed)
  assert.equal(user?.id, '123')
  assert.equal(user?.name, 'Alice')
  assert.equal(user?.avatarUrl, 'https://avatars.githubusercontent.com/u/1')
})

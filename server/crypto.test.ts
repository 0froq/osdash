import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { decryptString, encryptString } from './crypto'

const SECRET = 'test-session-secret-value'

it('round-trips AES-GCM payloads', async () => {
  const encrypted = await encryptString(SECRET, '{"login":"alice","token":"gho_x"}')
  assert.notEqual(encrypted, '{"login":"alice","token":"gho_x"}')
  const plain = await decryptString(SECRET, encrypted)
  assert.equal(plain, '{"login":"alice","token":"gho_x"}')
})

it('returns null for tampered ciphertext', async () => {
  const encrypted = await encryptString(SECRET, 'hello')
  const [iv, cipher] = encrypted.split('.')
  const tampered = `${iv}.${cipher?.replace(/^./, 'x')}`
  assert.equal(await decryptString(SECRET, tampered), null)
})

it('does not decrypt with a different secret', async () => {
  const encrypted = await encryptString(SECRET, 'secret-token')
  assert.equal(await decryptString('other-secret', encrypted), null)
})

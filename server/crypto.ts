const IV_BYTES = 12

async function importKey(secret: string): Promise<CryptoKey> {
  const encoded = new TextEncoder().encode(secret)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes
}

export async function encryptString(secret: string, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await importKey(secret)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`
}

export async function decryptString(secret: string, payload: string): Promise<string | null> {
  const [ivPart, cipherPart] = payload.split('.')
  if (!ivPart || !cipherPart) return null
  try {
    const key = await importKey(secret)
    const iv = new Uint8Array(fromBase64Url(ivPart))
    const cipher = new Uint8Array(fromBase64Url(cipherPart))
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
    return new TextDecoder().decode(plain)
  } catch {
    return null
  }
}

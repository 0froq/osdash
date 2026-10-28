export type ByokSettings = {
  baseUrl: string
  apiKey: string
  model: string
}

const MAX_HEADER = 8 * 1024

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const binary = atob(padded + pad)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
  } catch {
    return null
  }
}

export function parseByokHeader(value: string | undefined): ByokSettings | null {
  if (!value || value.length > MAX_HEADER) return null
  const bytes = fromBase64Url(value)
  if (!bytes) return null
  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<ByokSettings>
    if (!parsed.baseUrl || !parsed.apiKey || !parsed.model) return null
    return { baseUrl: parsed.baseUrl, apiKey: parsed.apiKey, model: parsed.model }
  } catch {
    return null
  }
}

export function encodeByokHeader(settings: ByokSettings): string {
  const bytes = new TextEncoder().encode(JSON.stringify(settings))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function parseClefLogins(raw: string | undefined | null): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map(entry => entry.trim().toLowerCase())
    .filter(entry => entry.length > 0)
}

export function clefEnabledForUser(
  login: string,
  byok: ByokSettings | null,
  allowList: readonly string[],
): boolean {
  if (usesWorkersAiClef(login, allowList)) return true
  return byok !== null
}

export function usesWorkersAiClef(login: string, allowList: readonly string[]): boolean {
  const needle = login.trim().toLowerCase()
  return allowList.some(entry => entry.trim().toLowerCase() === needle)
}

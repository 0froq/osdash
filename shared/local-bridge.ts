/** Device permission is separate from the Web app's GitHub login. */
export const LOCAL_BRIDGE_URL = 'http://127.0.0.1:47831'
export const LOCAL_BRIDGE_ORIGIN = 'https://osdash.froq.me'
export const LOCAL_BRIDGE_PROTOCOL = 3

export type LocalAccount = { id: string; login: string }
export type LocalConfig = {
  locale: 'system' | 'en' | 'zh-CN'
  notesConfigured: boolean
}
export type LocalCapability = 'config:read' | 'notes:read' | 'notes:write'
export type LocalBridgeStatus = {
  protocol: number
  challenge: string
  capabilities: LocalCapability[]
}
export type LocalPairing = LocalBridgeStatus & {
  token: string
  expiresAt: string
  account?: LocalAccount
}

export function isLocalAccount(value: unknown): value is LocalAccount {
  if (!value || typeof value !== 'object') return false
  const account = value as LocalAccount
  return (
    typeof account.id === 'string' &&
    /^[1-9]\d{0,19}$/.test(account.id) &&
    typeof account.login === 'string' &&
    /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(account.login)
  )
}

export function localUnitAddress(id: string) {
  const match =
    /^(pr|issue):([A-Za-z0-9][A-Za-z0-9-]{0,38})\/([A-Za-z0-9_.-]{1,100})#([1-9]\d{0,9})$/.exec(id)
  if (!match || match[3] === '.' || match[3] === '..') throw new Error('Invalid contribution id')
  return { kind: match[1]!, owner: match[2]!, repo: match[3]!, number: Number(match[4]) }
}

export function isLocalNoteId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

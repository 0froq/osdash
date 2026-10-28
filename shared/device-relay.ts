import {
  isLocalAccount,
  isLocalNoteId,
  localUnitAddress,
  type LocalAccount,
} from './local-bridge.ts'
import type { UnitNote } from './unit.ts'

export const DEVICE_PROTOCOL = 'osdash-device-v1'
export const MAX_RELAY_BYTES = 512 * 1024
export const DEVICE_TIMEOUT_MS = 20_000
export type DeviceCredential = {
  version: 1
  origin: string
  account: LocalAccount
  id: string
  secret: string
  name: string
}
export type DeviceInfo = {
  id: string
  name: string
  pairedAt: string
  online: boolean
  revision: string
}
export type NoteSnapshot = { notes: UnitNote[]; versions: Record<string, string> }
export type NoteOperation =
  | { action: 'list'; unit: string }
  | { action: 'save'; unit: string; note: UnitNote; version: string | null }
  | { action: 'delete'; unit: string; noteId: string; version: string | null }
export type DeviceCommand = NoteOperation & { id: string; type: 'request'; expiresAt: number }
export type DeviceResult = { type: 'result'; id: string; status: number; body: unknown }
export type RelayResponse = { status: number; body: unknown }
export type RelayStub = {
  register(
    account: LocalAccount,
    device: { id: string; secret: string; name: string },
  ): Promise<DeviceInfo>
  status(): Promise<DeviceInfo | null>
  revoke(id: string): Promise<void>
  request(operation: NoteOperation): Promise<RelayResponse>
}
export type RelayNamespace = { getByName(name: string): RelayStub }

export function validSecret(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
}
export function validVersion(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && /^[a-f0-9]{64}$/.test(value))
}
export function validNote(value: unknown): value is UnitNote {
  if (!value || typeof value !== 'object') return false
  const note = value as UnitNote
  return (
    typeof note.id === 'string' &&
    isLocalNoteId(note.id) &&
    typeof note.text === 'string' &&
    new TextEncoder().encode(note.text).length <= 64 * 1024 &&
    typeof note.anchor === 'string' &&
    Number.isFinite(Date.parse(note.anchor)) &&
    typeof note.at === 'string' &&
    Number.isFinite(Date.parse(note.at))
  )
}
export function validCredential(value: unknown, origin: string): value is DeviceCredential {
  if (!value || typeof value !== 'object') return false
  const item = value as DeviceCredential
  return (
    item.version === 1 &&
    item.origin === origin &&
    isLocalAccount(item.account) &&
    typeof item.id === 'string' &&
    isLocalNoteId(item.id) &&
    validSecret(item.secret) &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    item.name.length <= 64
  )
}
export function parseNoteOperation(value: unknown): NoteOperation {
  if (!value || typeof value !== 'object') throw new Error('Invalid note operation')
  const input = value as Record<string, unknown>
  if (typeof input.unit !== 'string') throw new Error('Contribution id required')
  localUnitAddress(input.unit)
  if (input.action === 'list') return { action: 'list', unit: input.unit }
  if (!validVersion(input.version)) throw new Error('Note version required')
  if (input.action === 'save' && validNote(input.note)) {
    const { id, text, anchor, at } = input.note
    return {
      action: 'save',
      unit: input.unit,
      note: { id, text, anchor, at },
      version: input.version,
    }
  }
  if (
    input.action === 'delete' &&
    typeof input.noteId === 'string' &&
    isLocalNoteId(input.noteId)
  ) {
    return { action: 'delete', unit: input.unit, noteId: input.noteId, version: input.version }
  }
  throw new Error('Invalid note operation')
}

export function socketCredential(header: string | null) {
  const protocols = header?.split(',').map(value => value.trim()) ?? []
  if (!protocols.includes(DEVICE_PROTOCOL)) return null
  const auth = protocols.find(value => value.startsWith('auth.'))
  const match = /^auth\.([1-9]\d{0,19})\.([a-f0-9-]{36})\.([A-Za-z0-9_-]{43})$/i.exec(auth ?? '')
  if (!match || !isLocalNoteId(match[2] ?? '')) return null
  return { accountId: match[1]!, id: match[2]!, secret: match[3]! }
}

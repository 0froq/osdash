import { computed, readonly, ref } from 'vue'
import { isLocalAccount } from '#shared/local-bridge'
import {
  noteKey,
  validNote,
  validVersion,
  type DeviceInfo,
  type NoteSnapshot,
  type NoteCatalog,
} from '#shared/device-relay'
import type { UnitNote } from '#shared/unit'

const device = ref<DeviceInfo | null>(null)
const error = ref('')
const session = ref(0)
const versions = new Map<string, Record<string, string>>()
let viewer = ''
let timer: ReturnType<typeof setInterval> | undefined
let pending: Promise<void> | null = null

function reset() {
  clearInterval(timer)
  timer = undefined
  viewer = ''
  pending = null
  device.value = null
  versions.clear()
  session.value++
  error.value = ''
}
async function refresh() {
  if (!import.meta.client || !viewer) return
  if (pending) return pending
  const operation = session.value
  const currentViewer = viewer
  const work = (async () => {
    try {
      const body = await $fetch<{ account: unknown; device: DeviceInfo | null }>(
        '/api/device/status',
        { retry: 0, timeout: 15_000 },
      )
      if (operation !== session.value || viewer !== currentViewer) return
      if (
        !isLocalAccount(body.account) ||
        body.account.login.toLowerCase() !== viewer.toLowerCase()
      )
        throw new Error('Account changed')
      if ((device.value?.id ?? null) !== (body.device?.id ?? null)) {
        versions.clear()
        session.value++
      }
      device.value = body.device
      error.value = ''
    } catch (cause) {
      if (operation !== session.value || viewer !== currentViewer) return
      const status = (cause as { statusCode?: number }).statusCode
      if (status === 401) reset()
      else if (device.value) device.value = { ...device.value, online: false }
      error.value =
        status === 401
          ? 'Sign in again to access your storage device.'
          : 'Could not reach the storage device relay.'
    }
  })()
  pending = work
  try {
    await work
  } finally {
    if (pending === work) pending = null
  }
}
function start(login: string) {
  if (!import.meta.client || (viewer === login && timer)) return
  reset()
  if (!login) return
  viewer = login
  void refresh()
  timer = setInterval(() => {
    if (!document.hidden) void refresh()
  }, 15_000)
}
function withSource(note: UnitNote, source?: string): UnitNote {
  if (note.source) return note
  return { ...note, source: source ?? 'global', writable: note.writable ?? true }
}
async function request(
  path: string,
  options: { method?: 'POST' | 'DELETE'; body?: Record<string, unknown> } = {},
): Promise<unknown> {
  if (!device.value?.online) throw new Error('Storage device is offline')
  try {
    return await $fetch(path, { ...options, retry: 0, timeout: 30_000 })
  } catch (cause) {
    const status = (cause as { statusCode?: number }).statusCode
    if ((status === 503 || status === 504) && device.value)
      device.value = { ...device.value, online: false }
    if (status === 401) reset()
    throw cause
  }
}
async function listNotes(unit: string): Promise<UnitNote[]> {
  const operation = session.value
  const body = (await request(`/api/device/notes?${new URLSearchParams({ unit })}`)) as NoteSnapshot
  if (
    !Array.isArray(body.notes) ||
    !body.notes.every(validNote) ||
    !body.versions ||
    body.notes.some(
      note =>
        !validVersion(body.versions[noteKey(note)] ?? body.versions[note.id]) ||
        (body.versions[noteKey(note)] ?? body.versions[note.id]) === null,
    )
  )
    throw new Error('Invalid storage response')
  if (operation === session.value) versions.set(unit, body.versions)
  return body.notes.map(note =>
    withSource({
      ...note,
      version: body.versions[noteKey(note)] ?? body.versions[note.id],
    }),
  )
}
async function saveNote(unit: string, note: UnitNote): Promise<UnitNote> {
  const operation = session.value
  const result = (await request('/api/device/notes', {
    method: 'POST',
    body: {
      unit,
      note,
      version:
        note.version === undefined ? (versions.get(unit)?.[noteKey(note)] ?? null) : note.version,
    },
  })) as { note: UnitNote; version: string }
  if (
    !validNote(result.note) ||
    result.note.id !== note.id ||
    !validVersion(result.version) ||
    !result.version
  )
    throw new Error('Invalid storage response')
  const stored = withSource(
    { ...result.note, source: note.source, version: result.version },
    note.source,
  )
  if (operation === session.value)
    versions.set(unit, { ...versions.get(unit), [noteKey(stored)]: result.version })
  return stored
}
async function deleteNote(
  unit: string,
  id: string,
  version: string | null = versions.get(unit)?.[id] ?? null,
  source?: string,
) {
  const operation = session.value
  await request('/api/device/notes', {
    method: 'DELETE',
    body: { unit, noteId: id, version, source },
  })
  if (operation === session.value && versions.has(unit)) {
    const next = { ...versions.get(unit) }
    delete next[noteKey({ id, source })]
    versions.set(unit, next)
  }
}
async function catalog(after?: string): Promise<NoteCatalog> {
  const query = new URLSearchParams(after ? { after } : {})
  const body = (await request(`/api/device/catalog?${query}`)) as NoteCatalog
  if (
    !Array.isArray(body.entries) ||
    !Array.isArray(body.sources) ||
    !Array.isArray(body.warnings) ||
    (body.next !== null && typeof body.next !== 'string') ||
    body.entries.some(
      row =>
        typeof row.unit !== 'string' ||
        !validNote(row.note) ||
        !validVersion(row.version) ||
        row.version === null,
    )
  )
    throw new Error('Invalid note catalog')
  return body
}
async function unlink() {
  if (!device.value) return
  const current = session.value
  await $fetch('/api/device', {
    method: 'DELETE',
    body: { id: device.value.id },
    retry: 0,
    timeout: 15_000,
  })
  if (session.value === current) {
    device.value = null
    versions.clear()
    session.value++
  }
}
export function useStorageDevice() {
  return {
    device: readonly(device),
    error: readonly(error),
    session: readonly(session),
    connected: computed(() => Boolean(device.value?.online)),
    canWriteNotes: computed(() => Boolean(device.value?.online)),
    revision: computed(() => device.value?.revision ?? ''),
    start,
    reset,
    refresh,
    listNotes,
    catalog,
    saveNote,
    deleteNote,
    unlink,
  }
}

import { computed, readonly, ref } from 'vue'
import {
  LOCAL_BRIDGE_PROTOCOL,
  LOCAL_BRIDGE_URL,
  type LocalBridgeStatus,
  type LocalConfig,
  type LocalPairing,
  type LocalAccount,
  isLocalAccount,
} from '#shared/local-bridge'

import type { UnitNote } from '#shared/unit'

// Client-memory credentials only. Do not use useState, localStorage, or URL parameters.
const status = ref<'disconnected' | 'connecting' | 'connected'>('disconnected')
const config = ref<LocalConfig | null>(null)
const error = ref<string | null>(null)
const capabilities = ref<string[]>([])
const account = ref<LocalAccount | null>(null)
const session = ref(0)
let token: string | null = null
let expiry: ReturnType<typeof setTimeout> | undefined
let generation = 0
let bridgeUrl = LOCAL_BRIDGE_URL

function clearConnection() {
  generation += 1
  clearTimeout(expiry)
  token = null
  session.value += 1
  account.value = null
  config.value = null
  capabilities.value = []
  status.value = 'disconnected'
}

async function request(
  path: string,
  init: RequestInit = {},
  credential: string | null = token,
): Promise<Response> {
  if (!import.meta.client) throw new Error('Local connection requires a browser')
  const operation = generation
  const headers = new Headers(init.headers)
  if (credential) headers.set('Authorization', `Bearer ${credential}`)
  const response = await fetch(`${bridgeUrl}${path}`, {
    ...init,
    headers,
    mode: 'cors',
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    if (response.status === 401 && operation === generation && credential === token) {
      clearConnection()
      error.value = 'Local pairing expired or was revoked. Restart the bridge to pair again.'
    }
    throw new Error(`Local bridge returned ${response.status}`)
  }
  return response
}

function assertProtocol(value: LocalBridgeStatus) {
  if (
    value.protocol !== LOCAL_BRIDGE_PROTOCOL ||
    !Array.isArray(value.capabilities) ||
    !value.capabilities.includes('config:read')
  ) {
    throw new Error('Unsupported local bridge protocol')
  }
}

async function refreshConfig() {
  if (!token) throw new Error('Connect this device first')
  const operation = generation
  const value = (await (await request('/v1/config')).json()) as LocalConfig
  if (operation !== generation) return
  if (
    !['system', 'en', 'zh-CN'].includes(value.locale) ||
    typeof value.notesConfigured !== 'boolean'
  ) {
    throw new Error('Invalid local configuration response')
  }
  config.value = { locale: value.locale, notesConfigured: value.notesConfigured }
}

async function connect(code: string, viewerLogin: string): Promise<boolean> {
  if (!import.meta.client) return false
  if (status.value !== 'disconnected') return false
  error.value = null
  status.value = 'connecting'
  const operation = generation
  try {
    const available = (await (await request('/v1/status')).json()) as LocalBridgeStatus
    assertProtocol(available)
    if (operation !== generation) return false
    const issued = await $fetch<{ grant: string; account: LocalAccount }>('/api/local/grant', {
      method: 'POST',
      body: { challenge: available.challenge },
    })
    if (
      !isLocalAccount(issued.account) ||
      issued.account.login.toLowerCase() !== viewerLogin.toLowerCase()
    ) {
      throw new Error('Sign in again before connecting this device')
    }
    if (operation !== generation) return false
    const paired = (await (
      await request('/v1/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), grant: issued.grant }),
      })
    ).json()) as LocalPairing
    if (operation !== generation) {
      // The account/page changed during pairing. Do not retain its credential.
      if (typeof paired.token === 'string') {
        try {
          await request('/v1/pair', { method: 'DELETE' }, paired.token)
        } catch {
          if (!token)
            error.value = 'Pairing cancelled here. Stop the bridge to ensure access is revoked.'
        }
      }
      return false
    }
    assertProtocol(paired)
    if (!isLocalAccount(paired.account) || paired.account.id !== issued.account.id) {
      throw new Error('Local account verification failed')
    }
    const remaining = Date.parse(paired.expiresAt) - Date.now()
    if (
      typeof paired.token !== 'string' ||
      !paired.token ||
      !Number.isFinite(remaining) ||
      remaining <= 0 ||
      remaining > 8 * 60 * 60 * 1000
    ) {
      throw new Error('Invalid local pairing response')
    }
    token = paired.token
    account.value = paired.account
    session.value += 1
    capabilities.value = [...paired.capabilities]
    // Arm expiry even if the first configuration read fails.
    expiry = setTimeout(clearConnection, remaining)
    status.value = 'connected'
    await refreshConfig()
    return true
  } catch (cause) {
    if (operation !== generation) return false
    if (!token) clearConnection()
    error.value = cause instanceof Error ? cause.message : 'Local connection failed'
    return false
  }
}

async function disconnect(): Promise<boolean> {
  if (!import.meta.client || status.value === 'connecting') return false
  error.value = null
  const operation = generation
  try {
    if (token) await request('/v1/pair', { method: 'DELETE' })
    if (operation !== generation) return false
    clearConnection()
    return true
  } catch {
    if (operation === generation) {
      error.value = 'Could not confirm revocation. Retry, or stop the bridge on this device.'
    }
    return false
  }
}

/** Forget credentials on sign-out, account change, or leaving the inbox. */
async function reset() {
  const previous = token
  clearConnection()
  error.value = null
  if (!import.meta.client || !previous) return
  const operation = generation
  try {
    await request('/v1/pair', { method: 'DELETE' }, previous)
  } catch {
    if (operation === generation) {
      error.value = 'Local credentials cleared here. Stop the bridge to ensure access is revoked.'
    }
  }
}

async function listNotes(unit: string): Promise<UnitNote[]> {
  if (!token || !account.value || !capabilities.value.includes('notes:read'))
    throw new Error('Local notes unavailable')
  const body = (await (await request(`/v1/notes?${new URLSearchParams({ unit })}`)).json()) as {
    notes: UnitNote[]
  }
  if (!Array.isArray(body.notes)) throw new Error('Invalid local notes response')
  return body.notes
}

async function saveNote(unit: string, note: UnitNote): Promise<UnitNote> {
  if (!token || !account.value || !capabilities.value.includes('notes:write'))
    throw new Error('Local notes unavailable')
  const body = (await (
    await request('/v1/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit, note }),
    })
  ).json()) as { note: UnitNote }
  if (!body.note || body.note.id !== note.id) throw new Error('Invalid local note response')
  return body.note
}

async function deleteNote(unit: string, id: string) {
  if (!token || !account.value || !capabilities.value.includes('notes:write'))
    throw new Error('Local notes unavailable')
  await request(`/v1/notes?${new URLSearchParams({ unit, id })}`, { method: 'DELETE' })
}

export function useLocalBridge() {
  const configured = useRuntimeConfig().public.osdashLocalBridgeUrl
  if (typeof configured === 'string' && configured) bridgeUrl = configured
  return {
    status: readonly(status),
    config: readonly(config),
    error: readonly(error),
    capabilities: readonly(capabilities),
    account: readonly(account),
    session: readonly(session),
    connected: computed(() => status.value === 'connected'),
    // Configuring a directory does not grant a capability the bridge lacks.
    canWriteNotes: computed(
      () =>
        status.value === 'connected' &&
        account.value !== null &&
        capabilities.value.includes('notes:write'),
    ),
    connect,
    disconnect,
    reset,
    refreshConfig,
    listNotes,
    saveNote,
    deleteNote,
  }
}

import type { H3Event } from 'h3'

export type WorkerBindings = {
  DEVICE_RELAY?: import('../shared/device-relay').RelayNamespace
  DEVICE_RELAY_SCOPE?: string
  AI?: import('./claim-classifier-clef').AiBinding
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  SESSION_SECRET?: string
  GITHUB_TOKEN?: string
  ACCESS_TEAM_DOMAIN?: string
  ACCESS_AUD?: string
  OSDASH_ACCESS_ENFORCE?: string
  OSDASH_CLEF_LOGINS?: string
  OAUTH_CALLBACK_ORIGIN?: string
}

export function workerEnv(event: H3Event): WorkerBindings {
  return (event.context.cloudflare?.env ?? {}) as WorkerBindings
}

export function bindingString(event: H3Event, name: keyof WorkerBindings): string | undefined {
  const fromWorker = workerEnv(event)[name]
  if (typeof fromWorker === 'string' && fromWorker !== '') return fromWorker
  const fromProcess = process.env[name]
  if (typeof fromProcess === 'string' && fromProcess !== '') return fromProcess
  return undefined
}

export function accessEnforced(event: H3Event): boolean {
  const value = bindingString(event, 'OSDASH_ACCESS_ENFORCE')
  return value === '1' || value?.toLowerCase() === 'true'
}

import { constants } from 'node:fs'
import { open } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { LOCAL_BRIDGE_ORIGIN } from '../shared/local-bridge.ts'
import { validateBridgeOrigin } from './bridge.ts'

export type RepoDirectory = { pattern: string; writable: boolean; repo?: string }
export type UserConfig = {
  version: 1
  origin: string
  locale: 'system' | 'en' | 'zh-CN'
  workspaceDirectory: string
  deviceDirectory: string
  notesDirectory: string
  repoDirectories: RepoDirectory[]
  notifyPollSeconds: number
}
export type ConfigOptions = { path?: string; home?: string; env?: NodeJS.ProcessEnv }

export function homePath(value: string, home: string): string {
  if (
    !value.trim() ||
    value.includes('\0') ||
    (value.startsWith('~') && !value.startsWith('~/') && value !== '~')
  )
    throw new Error('Expected a path, optionally starting with ~/')
  return resolve(
    home,
    value === '~' ? home : value.startsWith('~/') ? join(home, value.slice(2)) : value,
  )
}

export async function loadUserConfig(options: ConfigOptions = {}) {
  const home = options.home ?? homedir()
  const env = options.env ?? process.env
  // XDG requires absolute paths. Relative environment values are ignored.
  const configHome =
    env.XDG_CONFIG_HOME && isAbsolute(env.XDG_CONFIG_HOME)
      ? env.XDG_CONFIG_HOME
      : join(home, '.config')
  const candidates = options.path
    ? [homePath(options.path, home)]
    : [
        join(configHome, 'osdash/config.json'),
        join(home, '.osdash/config.json'),
        join(home, 'osdash/config.json'),
        // Legacy names remain readable but are never created by the new CLI.
        join(home, '.os/config.json'),
        join(home, 'os/config.json'),
      ]
  let path: string | null = null
  let raw: Record<string, unknown> = {}
  for (const candidate of candidates) {
    let file
    try {
      file = await open(candidate, constants.O_RDONLY | constants.O_NOFOLLOW)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT' && !options.path) continue
      throw new Error(`Cannot read config ${candidate}`, { cause: error })
    }
    try {
      const stat = await file.stat()
      if (!stat.isFile() || stat.size > 64 * 1024)
        throw new Error('Expected a config file under 64 KiB')
      const value: unknown = JSON.parse(await file.readFile('utf8'))
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Expected an object')
      raw = value as Record<string, unknown>
      path = candidate
      break
    } catch (error) {
      throw new Error(`Invalid config ${candidate}`, { cause: error })
    } finally {
      await file.close()
    }
  }
  try {
    if (raw.version !== undefined && raw.version !== 1)
      throw new Error('Unsupported config version')
    const string = (key: string, fallback: string) => {
      const value = raw[key] ?? fallback
      if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid ${key}`)
      return value
    }
    const origin = string('origin', LOCAL_BRIDGE_ORIGIN)
    validateBridgeOrigin(origin)
    const locale = raw.locale ?? 'system'
    if (locale !== 'system' && locale !== 'en' && locale !== 'zh-CN')
      throw new Error('Invalid locale')
    const workspaceDirectory = homePath(string('workspaceDirectory', '~/osdash'), home)
    const deviceDirectory = homePath(string('deviceDirectory', workspaceDirectory), home)
    const notesDirectory = homePath(
      string('notesDirectory', join(workspaceDirectory, 'notes')),
      home,
    )
    const notifyPollSeconds = raw.notifyPollSeconds ?? 10
    if (
      typeof notifyPollSeconds !== 'number' ||
      !Number.isInteger(notifyPollSeconds) ||
      (notifyPollSeconds !== 0 && (notifyPollSeconds < 10 || notifyPollSeconds > 86400))
    )
      throw new Error('notifyPollSeconds must be 0 or an integer from 10 to 86400')
    if (raw.repoDirectories !== undefined && !Array.isArray(raw.repoDirectories))
      throw new Error('Invalid repoDirectories')
    const repoDirectories: RepoDirectory[] = ((raw.repoDirectories ?? []) as unknown[]).map(
      item => {
        const entry =
          typeof item === 'string' ? { pattern: item } : (item as Record<string, unknown>)
        if (
          !entry ||
          typeof entry.pattern !== 'string' ||
          (entry.writable !== undefined && typeof entry.writable !== 'boolean')
        )
          throw new Error('Invalid repo directory')
        const repo = entry.repo
        if (
          repo !== undefined &&
          (typeof repo !== 'string' ||
            !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_.-]{1,100}$/.test(repo) ||
            ['.', '..'].includes(repo.split('/')[1]!))
        )
          throw new Error('Invalid repo override')
        return {
          pattern: homePath(entry.pattern, home),
          writable: entry.writable === true,
          ...(repo ? { repo: repo as string } : {}),
        }
      },
    )
    return {
      path,
      config: {
        version: 1,
        origin,
        locale,
        workspaceDirectory,
        deviceDirectory,
        notesDirectory,
        repoDirectories,
        notifyPollSeconds,
      } as UserConfig,
    }
  } catch (error) {
    throw new Error(`Invalid config ${path ?? '(defaults)'}: ${(error as Error).message}`, {
      cause: error,
    })
  }
}

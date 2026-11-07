import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { atomicWrite, readBounded, type LocalWorkspace } from './workspace.ts'
import type { UserConfig } from './config.ts'

const execute = promisify(execFile)
type Thread = { id: string; updated_at: string; subject: { title: string; type: string } }
export type PollState = { accountId: string; lastModified?: string; seen: Record<string, string> }
export class PollBackoff extends Error {
  constructor(public seconds: number) {
    super('GitHub notification polling is backing off')
  }
}
function backoff(response: Response, now: number) {
  const retry = response.headers.get('retry-after')
  const retrySeconds = retry
    ? /^\d+$/.test(retry)
      ? Number(retry)
      : (Date.parse(retry) - now) / 1000
    : 0
  const reset =
    response.headers.get('x-ratelimit-remaining') === '0'
      ? Number(response.headers.get('x-ratelimit-reset')) - now / 1000
      : 0
  return Math.max(
    60,
    Number.isFinite(retrySeconds) ? retrySeconds : 0,
    Number.isFinite(reset) ? reset : 0,
  )
}

export async function pollNotifications(
  token: string,
  accountId: string,
  previous: PollState | null,
  seconds: number,
  request = fetch,
) {
  const seen: Record<string, string> = {
    ...(previous?.accountId === accountId ? previous.seen : {}),
  }
  const baseline = previous?.accountId === accountId
  const changes: Thread[] = []
  let lastModified = previous?.lastModified
  let delay = Math.max(10, seconds)
  for (let page = 1; page <= 6; page++) {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'osdash-local',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    if (baseline && previous.lastModified && page === 1)
      headers['If-Modified-Since'] = previous.lastModified
    const response = await request(
      `https://api.github.com/notifications?participating=true&all=false&per_page=50&page=${page}`,
      { headers, signal: AbortSignal.timeout(20000) },
    )
    const interval = Number(response.headers.get('x-poll-interval'))
    if (Number.isFinite(interval)) delay = Math.max(delay, interval)
    if (response.status === 304 && page === 1) {
      if (!baseline) throw new Error('Unexpected conditional response')
      return { state: previous, changes, seconds: delay }
    }
    if (response.status === 403 || response.status === 429)
      throw new PollBackoff(Math.max(delay, backoff(response, Date.now())))
    if (!response.ok) throw new Error('GitHub notifications unavailable')
    const rows: unknown = await response.json()
    if (!Array.isArray(rows)) throw new Error('Invalid notifications response')
    if (page === 1) lastModified = response.headers.get('last-modified') ?? undefined
    for (const row of rows as Thread[]) {
      if (
        typeof row.id !== 'string' ||
        !/^\d+$/.test(row.id) ||
        typeof row.updated_at !== 'string' ||
        !Number.isFinite(Date.parse(row.updated_at))
      )
        throw new Error('Invalid thread')
      if (
        baseline &&
        seen[row.id] !== row.updated_at &&
        (row.subject?.type === 'Issue' || row.subject?.type === 'PullRequest') &&
        typeof row.subject.title === 'string'
      )
        changes.push(row)
      seen[row.id] = row.updated_at
    }
    if (rows.length < 50) break
    // Do not advance the conditional watermark after an incomplete scan.
    if (page === 6) lastModified = undefined
  }
  const bounded = Object.fromEntries(
    Object.entries(seen)
      .sort((a, b) => b[1].localeCompare(a[1]))
      .slice(0, 2000),
  )
  return { state: { accountId, lastModified, seen: bounded }, changes, seconds: delay }
}

const appleScript =
  'on run argv\n display notification (item 2 of argv) with title (item 1 of argv)\nend run'
async function notify(title: string, body: string) {
  if (process.platform === 'darwin')
    await execute('osascript', ['-e', appleScript, title, body], { timeout: 5000 })
  else if (process.platform === 'linux')
    await execute('notify-send', [title, body], { timeout: 5000 })
}

/** Uses local gh authentication. Web session tokens never leave the Web server. */
export function startNotificationPolling(
  workspace: LocalWorkspace,
  settings: () => Promise<UserConfig>,
  report: (message: string) => void,
) {
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let token = ''
  let verified = ''
  let previous: PollState | null = null
  let loaded = ''
  let lastError = ''
  async function tick() {
    let delay = 60
    try {
      const config = await settings()
      const device = await workspace.readDevice()
      if (config.notifyPollSeconds === 0 || !device) {
        delay = 30
        return
      }
      const account = device.account
      const statePath = join(config.workspaceDirectory, `notifications-${account.id}.json`)
      if (loaded !== account.id) {
        const text = await readBounded(statePath)
        previous = null
        if (text) {
          const state = JSON.parse(text) as PollState
          if (
            state.accountId !== account.id ||
            !state.seen ||
            typeof state.seen !== 'object' ||
            Array.isArray(state.seen) ||
            Object.values(state.seen).some(value => typeof value !== 'string') ||
            (state.lastModified !== undefined && typeof state.lastModified !== 'string')
          )
            throw new Error('Invalid notification state')
          previous = state
        }
        loaded = account.id
      }
      if (verified !== account.id) {
        token = (
          process.env.GITHUB_TOKEN ||
          process.env.GH_TOKEN ||
          (
            await execute(
              'gh',
              ['auth', 'token', '--hostname', 'github.com', '--user', account.login],
              { timeout: 5000, maxBuffer: 8192 },
            )
          ).stdout
        ).trim()
        const response = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'osdash-local' },
          signal: AbortSignal.timeout(20000),
        })
        if (!response.ok || String(((await response.json()) as { id?: number }).id) !== account.id)
          throw new Error('Local GitHub account differs from the paired account')
        verified = account.id
      }
      const result = await pollNotifications(token, account.id, previous, config.notifyPollSeconds)
      delay = result.seconds
      if (stopped) return
      // Save before showing alerts, so restarting never replays the whole unread inbox.
      if (result.state !== previous)
        await atomicWrite(statePath, `${JSON.stringify(result.state)}\n`)
      previous = result.state
      for (const thread of result.changes.slice(0, 5)) {
        if (stopped) return
        await notify('osdash', thread.subject.title)
      }
      if (result.changes.length > 5 && !stopped)
        await notify('osdash', `${result.changes.length - 5} more conversations updated`)
      if (lastError) report('GitHub notification polling resumed.')
      lastError = ''
    } catch (error) {
      delay = error instanceof PollBackoff ? error.seconds : 300
      verified = ''
      token = ''
      const message =
        error instanceof PollBackoff
          ? 'GitHub requested a notification polling backoff.'
          : 'Notification polling paused. Check local gh authentication for the paired account and system notification permissions.'
      if (message !== lastError) report(message)
      lastError = message
    } finally {
      if (!stopped)
        timer = setTimeout(
          () => {
            void tick()
          },
          Math.max(10, delay) * 1000,
        )
    }
  }
  void tick()
  return () => {
    stopped = true
    clearTimeout(timer)
    token = ''
  }
}

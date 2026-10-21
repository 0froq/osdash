import type { Check, CheckConclusion, CheckStatus } from './turn'

export type RawRestCheckRun = {
  name?: string
  status?: string
  conclusion?: string | null
  html_url?: string | null
  details_url?: string | null
  started_at?: string | null
  completed_at?: string | null
}

function checkStatus(value: string | undefined): CheckStatus {
  switch (value?.toUpperCase()) {
    case 'COMPLETED':
    case 'IN_PROGRESS':
    case 'QUEUED':
    case 'PENDING':
    case 'WAITING':
    case 'REQUESTED':
      return value.toUpperCase() as CheckStatus
    default:
      return 'PENDING'
  }
}

function checkConclusion(value: string | null | undefined): CheckConclusion {
  switch (value?.toUpperCase()) {
    case 'SUCCESS':
    case 'FAILURE':
    case 'CANCELLED':
    case 'SKIPPED':
    case 'NEUTRAL':
    case 'ACTION_REQUIRED':
    case 'TIMED_OUT':
    case 'STALE':
      return value.toUpperCase() as CheckConclusion
    default:
      return null
  }
}

export function checksFromRest(runs: readonly RawRestCheckRun[]): Check[] {
  const checks: Check[] = []
  for (const run of runs) {
    if (!run.name) continue
    checks.push({
      name: run.name,
      status: checkStatus(run.status),
      conclusion: checkConclusion(run.conclusion),
      url: run.html_url ?? run.details_url ?? undefined,
    })
  }
  return checks
}

export function mergeCheckLists(existing: readonly Check[], incoming: readonly Check[]): Check[] {
  if (incoming.length === 0) return [...existing]
  const byName = new Map(existing.map(check => [check.name, check]))
  for (const check of incoming) byName.set(check.name, check)
  return [...byName.values()]
}

export function isClaCheckName(name: string): boolean {
  return (
    /\bcla\b/i.test(name) || /cla-assistant|claassistant|google-cla|linux-foundation/i.test(name)
  )
}

/** First-time contributor workflows sit at `action_required` until a maintainer approves them. */
export function isFirstTimeApproval(check: Check): boolean {
  return check.conclusion === 'ACTION_REQUIRED' && !isClaCheckName(check.name)
}

/** A CLA check that failed, or is waiting on the contributor to sign. */
export function isFailingClaCheck(check: Check): boolean {
  if (!isClaCheckName(check.name)) return false
  return check.conclusion === 'FAILURE' || check.conclusion === 'ACTION_REQUIRED'
}

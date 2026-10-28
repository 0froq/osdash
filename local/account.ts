import { isLocalAccount, type LocalAccount } from '../shared/local-bridge.ts'

/** The bridge asks the configured HTTPS site to verify its short-lived grant. */
export async function verifyRemoteAccount(
  origin: string,
  grant: string,
  challenge: string,
): Promise<LocalAccount> {
  const response = await fetch(`${origin}/api/local/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant, challenge }),
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error('Account verification failed')
  const body = (await response.json()) as { account?: unknown }
  if (!isLocalAccount(body.account)) throw new Error('Invalid account verification response')
  return body.account
}

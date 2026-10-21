const AUTHORIZE = 'https://github.com/login/oauth/authorize'
const TOKEN = 'https://github.com/login/oauth/access_token'

export function oauthAuthorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user',
    state,
  })
  return `${AUTHORIZE}?${params.toString()}`
}

export async function exchangeOAuthCode(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<string> {
  const response = await fetch(TOKEN, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'osdash',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`GitHub OAuth token exchange failed: HTTP ${response.status}`)
  const payload = (await response.json()) as { access_token?: string; error?: string }
  if (!payload.access_token) {
    throw new Error(payload.error ?? 'GitHub OAuth token exchange failed')
  }
  return payload.access_token
}

export type GitHubUser = {
  login: string
  name: string | null
  avatarUrl: string | null
}

export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'osdash',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`GitHub user lookup failed: HTTP ${response.status}`)
  const payload = (await response.json()) as {
    login?: string
    name?: string | null
    avatar_url?: string | null
  }
  if (!payload.login) throw new Error('GitHub user lookup returned no login')
  return {
    login: payload.login,
    name: payload.name ?? null,
    avatarUrl: payload.avatar_url ?? null,
  }
}

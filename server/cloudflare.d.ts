type CacheStore = {
  get: (key: string) => Promise<string | null>
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>
}

type AiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>
}

declare module 'h3' {
  interface H3EventContext {
    cloudflare?: {
      env?: {
        CACHE?: CacheStore
        AI?: AiBinding
        GITHUB_CLIENT_ID?: string
        GITHUB_CLIENT_SECRET?: string
        SESSION_SECRET?: string
        GITHUB_TOKEN?: string
        ACCESS_TEAM_DOMAIN?: string
        ACCESS_AUD?: string
        OSDASH_ACCESS_ENFORCE?: string
      }
      context?: {
        waitUntil?: (promise: Promise<unknown>) => void
      }
    }
    osdashUser?: {
      login: string
      token: string
      name?: string
      avatarUrl?: string
    }
  }
}

export {}

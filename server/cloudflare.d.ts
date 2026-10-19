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
        GITHUB_TOKEN?: string
        ACCESS_TEAM_DOMAIN?: string
        ACCESS_AUD?: string
      }
    }
  }
}

export {}

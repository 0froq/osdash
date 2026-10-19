type CacheStore = {
  get: (key: string) => Promise<string | null>
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>
}

declare module 'h3' {
  interface H3EventContext {
    cloudflare?: {
      env?: {
        CACHE?: CacheStore
        GITHUB_TOKEN?: string
        ACCESS_TEAM_DOMAIN?: string
        ACCESS_AUD?: string
      }
    }
  }
}

export {}

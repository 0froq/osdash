import { defineEnv, string } from 'void/env'

export default defineEnv({
  GITHUB_CLIENT_ID: string(),
  GITHUB_CLIENT_SECRET: string(),
  SESSION_SECRET: string(),
  GITHUB_TOKEN: string(),
  ACCESS_TEAM_DOMAIN: string(),
  ACCESS_AUD: string(),
  OSDASH_ACCESS_ENFORCE: string(),
  OSDASH_CLEF_LOGINS: string(),
})

import { defineEnv, string } from 'void/env'

export default defineEnv({
  GITHUB_TOKEN: string(),
  ACCESS_TEAM_DOMAIN: string(),
  ACCESS_AUD: string(),
})

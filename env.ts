import { defineEnv, string } from 'void/env'

export default defineEnv({
  GITHUB_TOKEN: string(),
})

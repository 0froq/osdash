import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler(event => {
  setHeader(event, 'Cache-Control', 'no-store')
  const user = event.context.osdashUser
  if (!user) return { authenticated: false as const }
  return {
    authenticated: true as const,
    login: user.login,
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
  }
})

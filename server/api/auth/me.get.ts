export default defineEventHandler(event => {
  const user = event.context.osdashUser
  if (!user) return { authenticated: false as const }
  return { authenticated: true as const, login: user.login }
})

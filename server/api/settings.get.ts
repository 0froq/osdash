import { createError } from 'h3'
import { parseClefLogins, usesWorkersAiClef } from '../byok'
import { bindingString } from '../bindings'
import { devMock } from '../mock-state'

export default defineEventHandler(async event => {
  if (devMock(event)) return { clefBuiltIn: false }
  const user = event.context.osdashUser
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  return {
    clefBuiltIn: usesWorkersAiClef(
      user.login,
      parseClefLogins(bindingString(event, 'OSDASH_CLEF_LOGINS')),
    ),
  }
})

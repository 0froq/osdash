import { createError, getHeader } from 'h3'
import { accessEnforced, bindingString } from '../bindings'
import { accessAudiences, evaluateAccess } from '../access'

export default defineEventHandler(async event => {
  if (!accessEnforced(event)) return
  const decision = await evaluateAccess({
    dev: import.meta.dev,
    assertion: getHeader(event, 'cf-access-jwt-assertion'),
    teamDomain: bindingString(event, 'ACCESS_TEAM_DOMAIN'),
    audience: accessAudiences(bindingString(event, 'ACCESS_AUD')),
  })
  if (decision === 'forbidden') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
})

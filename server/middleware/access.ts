import { createError, getHeader, type H3Event } from 'h3'
import { accessAudiences, evaluateAccess } from '../access'

function binding(event: H3Event, name: 'ACCESS_TEAM_DOMAIN' | 'ACCESS_AUD'): string | undefined {
  const fromWorker = event.context.cloudflare?.env?.[name]
  if (typeof fromWorker === 'string' && fromWorker !== '') return fromWorker
  const fromProcess = process.env[name]
  if (typeof fromProcess === 'string' && fromProcess !== '') return fromProcess
  return undefined
}

export default defineEventHandler(async event => {
  const decision = await evaluateAccess({
    dev: import.meta.dev,
    assertion: getHeader(event, 'cf-access-jwt-assertion'),
    teamDomain: binding(event, 'ACCESS_TEAM_DOMAIN'),
    audience: accessAudiences(binding(event, 'ACCESS_AUD')),
  })
  if (decision === 'forbidden') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
})

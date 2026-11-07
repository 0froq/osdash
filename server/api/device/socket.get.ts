import { createError, defineEventHandler, getHeader, setHeader, setResponseStatus } from 'h3'
import {
  LOCAL_RELAY_HEADER,
  deviceSocketOrigin,
  socketCredential,
} from '../../../shared/device-relay'
import { workerEnv } from '../../bindings'

/** Production sockets are intercepted by the native Worker before Nitro. */
export default defineEventHandler(async event => {
  if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  setHeader(event, 'Cache-Control', 'no-store')
  const protocol = getHeader(event, 'sec-websocket-protocol')
  if (!socketCredential(protocol ?? null))
    throw createError({ statusCode: 401, statusMessage: 'Device authorization required' })
  const origin = workerEnv(event).DEVICE_RELAY_LOCAL_ORIGIN
  if (!origin) throw createError({ statusCode: 503, statusMessage: 'Local relay unavailable' })
  const relayOrigin = deviceSocketOrigin('http://localhost', origin)
  const response = await fetch(`${relayOrigin}/api/device/socket`, {
    headers: { 'Sec-WebSocket-Protocol': protocol! },
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  })
  if (response.status === 204) setHeader(event, LOCAL_RELAY_HEADER, relayOrigin)
  setResponseStatus(event, response.status)
  return null
})

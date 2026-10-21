import { getRequestURL, type H3Event } from 'h3'

export function getRequestOrigin(event: H3Event): string {
  const url = getRequestURL(event)
  const forwarded = event.node.req.headers['x-forwarded-proto']
  const proto =
    typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : url.protocol.replace(':', '')
  const host = event.node.req.headers['x-forwarded-host'] ?? event.node.req.headers.host ?? url.host
  const hostValue = Array.isArray(host) ? host[0] : host
  return `${proto}://${hostValue}`
}

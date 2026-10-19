import { createError, getQuery } from 'h3'
import { readCache, writeCache } from '../cache'
import { loadBoard } from '../github'
import { mockItems } from '../mock'
import { createNotionSource } from '../notion'
import { summarize } from '../../shared/turn'

const KEY = 'board:v1'
const TTL_SECONDS = 10 * 60

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const now = new Date()
  const mock = import.meta.dev && (query.mock === '1' || process.env.OSDASH_MOCK === '1')
  if (mock) {
    const items = mockItems(now.getTime())
    return {
      generatedAt: now.toISOString(),
      cached: false,
      truncated: false,
      mock: true,
      notion: { connected: createNotionSource().connected },
      stats: summarize(items),
      items,
    }
  }

  const refresh = query.refresh === '1'
  const store = event.context.cloudflare?.env?.CACHE
  if (!refresh) {
    const hit = await readCache(store, KEY, now.getTime())
    if (hit) {
      const cached = JSON.parse(hit) as Record<string, unknown>
      return { ...cached, cached: true }
    }
  }

  const token = event.context.cloudflare?.env?.GITHUB_TOKEN || process.env.GITHUB_TOKEN
  if (!token) {
    throw createError({ statusCode: 503, statusMessage: '缺少 GITHUB_TOKEN' })
  }

  try {
    const loaded = await loadBoard(token, now)
    const body = {
      generatedAt: now.toISOString(),
      cached: false,
      truncated: loaded.truncated,
      mock: false,
      notion: { connected: createNotionSource().connected },
      stats: summarize(loaded.items),
      items: loaded.items,
    }
    await writeCache(store, KEY, JSON.stringify(body), TTL_SECONDS, now.getTime())
    return body
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub 搜索失败'
    throw createError({ statusCode: 502, statusMessage: message })
  }
})

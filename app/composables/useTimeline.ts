import type { TimelinePayload } from '#shared/story'

const cache = new Map<string, TimelinePayload>()
const requests = new Map<string, Promise<TimelinePayload>>()

export function useTimeline() {
  const { mock: mockMode } = useMockMode()
  const payload = ref<TimelinePayload | null>(null)
  const pending = ref(false)
  const error = ref('')
  const activeId = ref('')

  async function load(id: string, refresh = false): Promise<void> {
    const key = `${mockMode.value ? 'mock' : 'live'}:${id}`
    if (activeId.value !== id) payload.value = null
    activeId.value = id
    if (!refresh) {
      const hit = cache.get(key)
      if (hit) {
        payload.value = hit
        error.value = ''
        pending.value = false
        return
      }
    }
    pending.value = true
    error.value = ''
    const params = new URLSearchParams({ id })
    if (mockMode.value) params.set('mock', '1')
    if (refresh) params.set('refresh', '1')
    try {
      let request = refresh ? undefined : requests.get(key)
      if (!request) {
        request = $fetch<TimelinePayload>(`/api/timeline?${params.toString()}`)
        requests.set(key, request)
      }
      let body: TimelinePayload
      try {
        body = await request
      } finally {
        if (requests.get(key) === request) requests.delete(key)
      }
      cache.set(key, body)
      if (activeId.value !== id) return
      payload.value = body
    } catch {
      if (activeId.value !== id) return
      payload.value = null
      error.value = 'failed'
    } finally {
      if (activeId.value === id) pending.value = false
    }
  }

  function clear(): void {
    activeId.value = ''
    payload.value = null
    error.value = ''
    pending.value = false
  }

  return { payload, pending, error, load, clear }
}

import type { TimelinePayload } from '#shared/story'

const cache = new Map<string, TimelinePayload>()

export function useTimeline() {
  const { mock: mockMode } = useMockMode()
  const payload = ref<TimelinePayload | null>(null)
  const pending = ref(false)
  const error = ref('')
  const activeId = ref('')

  async function load(id: string, refresh = false): Promise<void> {
    activeId.value = id
    if (!refresh) {
      const hit = cache.get(id)
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
      const body = await $fetch<TimelinePayload>(`/api/timeline?${params.toString()}`)
      if (activeId.value !== id) return
      cache.set(id, body)
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

import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test'
import { ref } from 'vue'
import type { TimelinePayload } from '#shared/story'
import { useTimeline } from '../composables/useTimeline'

const mock = ref(false)
const fetchTimeline = vi.fn()
const payload = (id: string): TimelinePayload => ({
  id,
  generatedAt: '2026-10-25T00:00:00Z',
  cached: false,
  entries: [],
  items: [],
  truncated: false,
})

beforeEach(() => {
  mock.value = false
  fetchTimeline.mockReset()
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('useMockMode', () => ({ mock }))
  vi.stubGlobal('$fetch', fetchTimeline)
})

afterEach(() => vi.unstubAllGlobals())

it('shares an in-flight request and cached data between card and panel', async () => {
  const body = payload('shared')
  let resolve!: (value: TimelinePayload) => void
  fetchTimeline.mockReturnValue(new Promise<TimelinePayload>(done => (resolve = done)))
  const card = useTimeline()
  const panel = useTimeline()
  const first = card.load(body.id)
  const second = panel.load(body.id)
  expect(fetchTimeline).toHaveBeenCalledTimes(1)
  resolve(body)
  await Promise.all([first, second])
  expect(card.payload.value).toEqual(body)
  expect(panel.payload.value).toEqual(body)
  await useTimeline().load(body.id)
  expect(fetchTimeline).toHaveBeenCalledTimes(1)
})

it('does not reuse mock data for live requests', async () => {
  const body = payload('modes')
  fetchTimeline.mockResolvedValue(body)
  mock.value = true
  await useTimeline().load(body.id)
  expect(fetchTimeline).toHaveBeenLastCalledWith('/api/timeline?id=modes&mock=1')
  mock.value = false
  await useTimeline().load(body.id)
  expect(fetchTimeline).toHaveBeenCalledTimes(2)
  expect(fetchTimeline).toHaveBeenLastCalledWith('/api/timeline?id=modes')
})

it('clears the previous item while switching and allows retry after failure', async () => {
  const timeline = useTimeline()
  fetchTimeline.mockResolvedValueOnce(payload('old'))
  await timeline.load('old')
  fetchTimeline.mockRejectedValueOnce(new Error('offline'))
  const failed = timeline.load('new')
  expect(timeline.payload.value).toBeNull()
  await failed
  expect(timeline.error.value).toBe('failed')
  fetchTimeline.mockResolvedValueOnce(payload('new'))
  await timeline.load('new')
  expect(timeline.payload.value?.id).toBe('new')
  expect(timeline.error.value).toBe('')
})

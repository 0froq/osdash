import { createError, readBody } from 'h3'
import { workerEnv } from '../bindings'
import { devMock, mockPatchPrefs } from '../mock-state'
import { writePrefs, type PrefsPatch } from '../user-state'

type PrefsBody = {
  star?: { id?: string; on?: boolean }
  later?: { id?: string; until?: string | null }
}

export default defineEventHandler(async event => {
  const user = event.context.osdashUser
  if (!user && !devMock(event))
    throw createError({ statusCode: 401, statusMessage: 'Sign in required' })

  const body = (await readBody(event)) as PrefsBody
  const patch: PrefsPatch = {}
  if (body.star && typeof body.star.id === 'string' && typeof body.star.on === 'boolean') {
    patch.star = { id: body.star.id, on: body.star.on }
  }
  if (body.later && typeof body.later.id === 'string') {
    const until = body.later.until
    patch.later = { id: body.later.id, until: typeof until === 'string' ? until : null }
  }
  if (!patch.star && !patch.later) {
    throw createError({ statusCode: 400, statusMessage: 'star or later is required' })
  }

  if (devMock(event)) return { ok: true as const, prefs: mockPatchPrefs(patch) }
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  const prefs = await writePrefs(workerEnv(event).CACHE, user.login, patch, Date.now())
  return { ok: true as const, prefs }
})

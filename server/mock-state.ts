import type { H3Event } from 'h3'
import { getQuery } from 'h3'
import { isMockEnabled } from '../shared/mock-mode'
import { mockUnits } from './mock'
import type { Unit } from '../shared/unit'

export function devMock(event: H3Event): boolean {
  const query = getQuery(event)
  return isMockEnabled({
    dev: import.meta.dev,
    queryMock: query.mock,
    envMock: process.env.OSDASH_MOCK,
  })
}

export function mockUnitsNow(nowMs: number): Unit[] {
  return mockUnits(nowMs)
}

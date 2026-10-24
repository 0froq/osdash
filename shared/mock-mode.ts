export function isMockEnabled(options: {
  dev: boolean
  queryMock: unknown
  envMock: string | undefined
}): boolean {
  if (!options.dev) return false
  return queryIsMock(options.queryMock) || options.envMock === '1'
}

export function withMockQuery(path: string, mock: boolean): string {
  if (!mock) return path
  return path.includes('?') ? `${path}&mock=1` : `${path}?mock=1`
}

function queryIsMock(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(item => item === '1')
  return value === '1'
}

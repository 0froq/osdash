import { isMockEnabled } from '#shared/mock-mode'

export function useMockMode() {
  const route = useRoute()
  const config = useRuntimeConfig()
  const mock = computed(() =>
    isMockEnabled({
      dev: import.meta.dev,
      queryMock: route.query.mock,
      envMock: config.public.osdashMock,
    }),
  )
  return { mock }
}

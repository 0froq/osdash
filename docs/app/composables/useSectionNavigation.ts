import type { InjectionKey, Ref, ShallowRef } from 'vue'

interface SectionNavigation {
  open: Ref<boolean>
  available: Ref<boolean>
  trigger: ShallowRef<HTMLElement | null>
}

const sectionNavigationKey: InjectionKey<SectionNavigation> = Symbol('section-navigation')

export function provideSectionNavigation() {
  const navigation: SectionNavigation = {
    open: ref(false),
    available: ref(false),
    trigger: shallowRef(null),
  }
  provide(sectionNavigationKey, navigation)
}

export function useSectionNavigation() {
  const navigation = inject(sectionNavigationKey)
  if (!navigation) throw new Error('Section navigation requires the default layout')
  return navigation
}

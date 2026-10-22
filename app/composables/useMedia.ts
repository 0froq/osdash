/** Breakpoints from the plan: phone ≤760, overlay panel 760–1100. */
export function useMedia() {
  const isMobile = ref(false)
  const isOverlay = ref(false)

  function read(): void {
    const mobile = window.matchMedia('(max-width: 760px)').matches
    const narrow = window.matchMedia('(max-width: 1100px)').matches
    isMobile.value = mobile
    isOverlay.value = narrow && !mobile
  }

  onMounted(() => {
    const mobileQuery = window.matchMedia('(max-width: 760px)')
    const narrowQuery = window.matchMedia('(max-width: 1100px)')
    read()
    mobileQuery.addEventListener('change', read)
    narrowQuery.addEventListener('change', read)
    onBeforeUnmount(() => {
      mobileQuery.removeEventListener('change', read)
      narrowQuery.removeEventListener('change', read)
    })
  })

  return { isMobile, isOverlay }
}

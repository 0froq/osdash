/**
 * Resolves once `el` has stopped changing for `quiet` ms. Markdown bodies render
 * asynchronously after a client-side navigation, and the layers measure the final layout.
 */
export function settled(el: Element, quiet = 120, max = 2000): Promise<void> {
  return new Promise((resolve) => {
    let timer = setTimeout(done, quiet)
    const cap = setTimeout(done, max)
    const observer = new MutationObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(done, quiet)
    })
    observer.observe(el, { childList: true, subtree: true, characterData: true })
    function done(): void {
      observer.disconnect()
      clearTimeout(timer)
      clearTimeout(cap)
      resolve()
    }
  })
}

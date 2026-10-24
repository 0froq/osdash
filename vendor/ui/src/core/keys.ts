export function wrap(index: number, length: number): number {
  return ((index % length) + length) % length
}

/** Where a roving-tabindex group goes for a key press, or `undefined` when the key is not ours. */
export function targetIndex(key: string, current: number, length: number): number | undefined {
  if (length === 0)
    return undefined
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return wrap(current + 1, length)
    case 'ArrowLeft':
    case 'ArrowUp':
      return wrap(current - 1, length)
    case 'Home':
      return 0
    case 'End':
      return length - 1
    default:
      return undefined
  }
}

/** Shared filename identity for the build scanner and Vite's module loader. */
export function componentFile(file: string) {
  const match = file.match(/(?:^|\/)([^/]+)\/([^/]+?)(\.demo)?\.(vue|ts)$/)
  if (!match || match[2] === 'index')
    return undefined
  const concept = match[1]!
  const name = match[2]!
  const id = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  return { concept, name, id, demo: Boolean(match[3]), to: `/components/${concept}/${id}` }
}

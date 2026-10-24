// Nuxt Content treats an empty `title` as missing and fills it from the filename.
// An explicit `title: ''` is a placeholder, so put the empty string back.

const FRONTMATTER = /^---\n([\s\S]*?)\n---/

export function keepEmptyTitle(content: object, body: unknown): void {
  if (typeof body !== 'string')
    return
  const frontmatter = FRONTMATTER.exec(body)?.[1]
  const line = frontmatter?.split('\n').find(row => row.startsWith('title:'))
  if (!line)
    return
  const value = line.slice('title:'.length).trim()
  if (value !== '' && value !== '\'\'' && value !== '""')
    return
  const page = content as { title?: string, seo?: { title?: string } }
  page.title = ''
  if (page.seo)
    page.seo.title = ''
}

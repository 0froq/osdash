import type { Element, Root } from 'hast'
import { toText } from 'hast-util-to-text'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'

// Raw HTML is parsed into nodes, then sanitized. No Vue/MDC evaluation or images.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, {
    ...defaultSchema,
    tagNames: [
      'a',
      'b',
      'blockquote',
      'br',
      'code',
      'dd',
      'del',
      'details',
      'div',
      'dl',
      'dt',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'i',
      'input',
      'kbd',
      'li',
      'ol',
      'p',
      'pre',
      's',
      'span',
      'strong',
      'sub',
      'summary',
      'sup',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'ul',
    ],
    attributes: {
      '*': ['title'],
      'a': ['href'],
      'details': ['open'],
      'input': [
        ['type', 'checkbox'],
        ['disabled', true],
        ['checked', true],
      ],
      'li': [['className', 'task-list-item']],
      'ol': ['start', ['className', 'contains-task-list']],
      'ul': [['className', 'contains-task-list']],
      'td': [['align', 'left', 'center', 'right']],
      'th': [['align', 'left', 'center', 'right']],
    },
    protocols: { href: ['http', 'https', 'mailto'] },
    strip: [
      'script',
      'style',
      'iframe',
      'object',
      'embed',
      'svg',
      'math',
      'template',
      'form',
      'textarea',
      'select',
      'button',
    ],
  })
  .use(rehypeStringify)

function parse(source: string): Root {
  return processor.runSync(processor.parse(source))
}

function visit(parent: Root | Element, transform: (element: Element) => void) {
  for (const child of parent.children) {
    if (child.type !== 'element') continue
    transform(child)
    visit(child, transform)
  }
}

/** Relative GitHub links resolve against the original comment, never this app. */
export function renderMarkdown(source: string, baseUrl?: string): string {
  const tree = parse(source)
  visit(tree, element => {
    if (element.tagName !== 'a' || typeof element.properties.href !== 'string') return
    try {
      const url = new URL(element.properties.href, baseUrl)
      if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) throw new Error('Unsupported URL')
      element.properties.href = url.href
      if (url.protocol !== 'mailto:') {
        element.properties.target = '_blank'
        element.properties.rel = ['noopener', 'noreferrer']
      }
    } catch {
      delete element.properties.href
    }
  })
  return processor.stringify(tree)
}

/** Summaries remain plain text. Omit quoted history and fenced code as before. */
export function markdownExcerpt(source: string): string | undefined {
  const tree = parse(source)
  function omitQuotes(parent: Root | Element) {
    parent.children = parent.children.filter(
      child => child.type !== 'element' || !['blockquote', 'pre'].includes(child.tagName),
    )
    for (const child of parent.children) {
      if (child.type === 'element') omitQuotes(child)
    }
  }
  omitQuotes(tree)
  const text = toText(tree).replace(/\s+/g, ' ').trim()
  return text ? Array.from(text).slice(0, 140).join('') : undefined
}

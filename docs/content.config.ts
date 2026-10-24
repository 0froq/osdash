import { fileURLToPath } from 'node:url'
import { defineCollection, defineContentConfig, z } from '@nuxt/content'
import { defineOgImageSchema } from 'nuxt-og-image/content'

const field = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean().default(false),
  default: z.string().optional(),
  description: z.string(),
})

// Optional frontmatter `cover`: a `public/` path or an absolute https URL. It wins over `ogImage.url`.
const card = {
  cover: z.string().optional(),
  ogImage: defineOgImageSchema({ z }),
  words: z.number().optional(),
  evergreen: z.boolean().optional(),
  kind: z.string().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
  last_modified: z.string().optional(),
}

// Every file lives under a locale folder (`zh/`, `en/`), so paths start with `/zh`, `/en`.
export default defineContentConfig({
  collections: {
    pages: defineCollection({
      type: 'page',
      source: {
        include: '*/**/*.md',
        exclude: ['*/docs/**', '*/changelog/**'],
      },
      schema: z.object({
        kicker: z.string().optional(),
        head: z.boolean().default(true),
        date: z.string().optional(),
        ...card,
      }),
    }),
    changelog: defineCollection({
      type: 'page',
      source: '*/changelog/*.md',
      schema: z.object({
        version: z.string(),
        date: z.string(),
        ...card,
      }),
    }),
    // Numeric prefixes (`1.install.md`) order the sidebar and are dropped from the path.
    docs: defineCollection({
      type: 'page',
      source: '*/docs/**/*.md',
      schema: z.object({
        kicker: z.string().optional(),
        date: z.string().optional(),
        ...card,
      }),
    }),
    // `Name.md` is English. `Name.zh.md` is Chinese. Both sit next to the component.
    reference: defineCollection({
      type: 'page',
      source: {
        cwd: fileURLToPath(new URL('../src/components', import.meta.url)),
        include: '**/*.md',
      },
      schema: z.object({
        designStatus: z.literal('ai-draft').default('ai-draft'),
        model: field.omit({ name: true }).optional(),
        props: z.array(field).default([]),
        slots: z.array(field.omit({ type: true, required: true, default: true })).default([]),
        events: z.array(z.object({
          name: z.string(),
          payload: z.string(),
          description: z.string(),
        })).default([]),
        ...card,
      }),
    }),
  },
})

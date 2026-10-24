import type { Component } from 'vue'
import { componentFile } from '~/utils/component-files'

interface ModuleShape {
  default?: Component
  demo?: Component
}

const modules = import.meta.glob('../../../src/components/*/*.{vue,ts}', { eager: true }) as Record<string, ModuleShape>

export interface CatalogItem {
  id: string
  name: string
  to: string
  demo?: Component
  snippet: string
}

export interface ConceptGroup {
  id: string
  items: CatalogItem[]
}

export interface CatalogSection {
  id: SectionId
  concepts: ConceptGroup[]
}

const SECTIONS = [
  { id: 'form', concepts: ['field', 'date', 'select', 'checkbox'] },
  { id: 'prose', concepts: ['radio', 'toggle', 'button'] },
] as const

type SectionId = typeof SECTIONS[number]['id']

/** One group per folder in `src/components`. A sibling `Name.demo.vue` is that component's demo. */
function createCatalog(): ConceptGroup[] {
  const groups = new Map<string, { files: Map<string, ModuleShape>, demos: Map<string, Component> }>()

  for (const [path, mod] of Object.entries(modules)) {
    const parsed = componentFile(path)
    if (!parsed)
      continue
    const group = groups.get(parsed.concept) ?? { files: new Map(), demos: new Map() }
    if (parsed.demo) {
      if (mod.default)
        group.demos.set(parsed.name, mod.default)
    }
    else {
      group.files.set(parsed.name, mod)
    }
    groups.set(parsed.concept, group)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, group]) => {
      const names = [...group.files.keys()]
      const items = [...names].sort((a, b) => a.localeCompare(b)).map((name) => {
        const mod = group.files.get(name)
        const identity = componentFile(`${id}/${name}.vue`)!
        return {
          id: identity.id,
          name,
          to: identity.to,
          demo: group.demos.get(name) ?? mod?.demo,
          snippet: `import '@froq/ui/style.css'\nimport { ${name} } from '@froq/ui'`,
        }
      })
      return { id, items }
    })
}

const catalog = createCatalog()

export function componentCatalog(): ConceptGroup[] {
  return catalog
}

export function componentSectionLabel(id: '' | 'form' | 'prose', translate: (key: 'components.sections.form' | 'components.sections.prose') => string): string {
  switch (id) {
    case '':
      return ''
    case 'form':
      return translate('components.sections.form')
    case 'prose':
      return translate('components.sections.prose')
    default: {
      const unexpected: never = id
      return unexpected
    }
  }
}

/** Concepts sit under a section such as form or prose. A folder with no section is still listed. */
export function componentSections(): Array<CatalogSection | { id: '', concepts: ConceptGroup[] }> {
  const byId = new Map(catalog.map(group => [group.id, group]))
  const used = new Set<string>()
  const sections: Array<CatalogSection | { id: '', concepts: ConceptGroup[] }> = SECTIONS.flatMap((section) => {
    const concepts = section.concepts.flatMap((id) => {
      const group = byId.get(id)
      if (!group)
        return []
      used.add(id)
      return [group]
    })
    return concepts.length ? [{ id: section.id, concepts }] : []
  })
  const rest = catalog.filter(group => !used.has(group.id))
  if (rest.length)
    sections.push({ id: '', concepts: rest })
  return sections
}

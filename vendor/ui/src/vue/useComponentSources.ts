import type { ComponentInternalInstance, VNode } from 'vue'
import { getCurrentInstance, shallowRef } from 'vue'

export type ComponentSource = 'library' | 'project'

export interface ComponentSourceEntry {
  /** Component name, taken from the file name when the component declares none. */
  name: string
  /** Absolute path of the single file component. */
  file: string
  source: ComponentSource
  /** Root elements the instance renders. */
  elements: Element[]
}

export interface ComponentSourceOptions {
  /** Files matching this pattern count as library components. Everything else is the project's. */
  library?: RegExp
  /** Files matching this pattern are skipped, for example framework internals. */
  ignore?: RegExp
}

const LIBRARY = /[\\/]vendor[\\/]ui[\\/]|[\\/]node_modules[\\/]@froq[\\/]ui[\\/]/
const IGNORE = /[\\/]node_modules[\\/](?!@froq[\\/]ui[\\/])|[\\/]\.nuxt[\\/]|[\\/]devtools[\\/]UiDevtools/

interface ComponentType {
  __file?: string
  __name?: string
  name?: string
}

function nameOf(type: ComponentType, file: string): string {
  return type.__name ?? type.name ?? file.split(/[\\/]/).pop()?.replace(/\.\w+$/, '') ?? 'Anonymous'
}

function elementsOf(root: VNode): Element[] {
  const start = root.el as Node | null
  if (!start)
    return []
  if (start.nodeType === 1)
    return [start as Element]
  // A fragment root renders siblings between its start and end anchors.
  const elements: Element[] = []
  for (let node: Node | null = start; node; node = node.nextSibling) {
    if (node.nodeType === 1)
      elements.push(node as Element)
    if (node === root.anchor)
      break
  }
  return elements
}

function walk(vnode: VNode | null | undefined, visit: (instance: ComponentInternalInstance) => void): void {
  if (!vnode)
    return
  if (vnode.component) {
    visit(vnode.component)
    walk(vnode.component.subTree, visit)
    return
  }
  walk(vnode.suspense?.activeBranch, visit)
  if (Array.isArray(vnode.children)) {
    for (const child of vnode.children) {
      if (child && typeof child === 'object' && 'type' in child)
        walk(child as VNode, visit)
    }
  }
}

/**
 * Walk the running app's component tree and report which single file components come from the
 * library and which are the project's own. It reads `__file`, which only exists in development
 * builds, so in production `scan` finds nothing.
 */
export function useComponentSources(options: ComponentSourceOptions = {}) {
  const app = getCurrentInstance()?.appContext.app
  const entries = shallowRef<ComponentSourceEntry[]>([])

  function scan(): void {
    const found: ComponentSourceEntry[] = []
    const library = options.library ?? LIBRARY
    const ignore = options.ignore ?? IGNORE
    walk(app?._instance?.subTree, (instance) => {
      const type = instance.type as ComponentType
      const file = type.__file
      if (!file || ignore.test(file))
        return
      const elements = elementsOf(instance.subTree).filter(element => element.isConnected)
      if (elements.length)
        found.push({ name: nameOf(type, file), file, source: library.test(file) ? 'library' : 'project', elements })
    })
    entries.value = found
  }

  return { entries, scan }
}

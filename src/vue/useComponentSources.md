# useComponentSources

Reports which single file components on the page come from the library and which the project wrote.
It walks the running app's component tree and reads each component's `__file`, which Vue only sets in
development builds. In production `scan` finds nothing.

```ts
import { useComponentSources } from '@froq/ui/vue'

const { entries, scan } = useComponentSources()
scan()
// entries.value: [{ name, file, source: 'library' | 'project', elements }]
```

Call it inside `setup`, because it needs the app instance. `scan` replaces `entries` with a fresh snapshot,
so call it again after the page changes. Each entry has the component name, its file, the `source` and the
root elements it renders. Components without a rendered root element are left out.

`library` is a pattern for library file paths and defaults to `vendor/ui` or `node_modules/@froq/ui`.
`ignore` skips files, by default other `node_modules`, `.nuxt` and the devtools overlay itself.

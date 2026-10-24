# @froq/ui

Shared logic, a token contract, and the components.
`core` and `vue` have no project styles.
Components live in `src/components`.

```
src/
  core/         TypeScript. No framework. Tokens, keyboard, strokes, reduced motion
  vue/          Vue behavior without styles
  components/   One directory per concept, such as radio/ or toggle/
  index.ts      Components exported from @froq/ui
  style.css
  tokens.css
docs/           Docs site. It depends on this package. Component and docs changes ship together
```

## Components

> [!NOTE]
> AI draft. Not yet accepted by a manual design pass.
> A working component is not a finished design.
> Each note records `designStatus: ai-draft`.
> The docs site shows that mark.
> Keeping the current implementation does not clear it.

Everything below is exported from `@froq/ui`.

| Component | Role |
| --- | --- |
| Button / CopyButton | Native button. Async clipboard, stable width |
| TextInput / TextArea / Select / Checkbox | Native fields. Attributes and events reach the control |
| FormField / NumberInput / DateInput / Slider / FileUpload / RadioGroup | Label, error, native value. Validation stays with the caller |
| Choice / ChoiceCircle / Toggle | Controlled choice and switch. Custom radio does not submit a form value |
| ToggleGroup | Single or multiple. Arrow keys move focus. A selected value can be cleared |
| Combobox | Search and multiple selection. Remote requests stay with the caller |
| Calendar / DatePicker | One month. ISO dates, locale, range, disabled dates |
| Navigation / Sidebar | Flat links and collapsible groups. Routing stays with the caller |
| Breadcrumb / Pagination | Path and page links. No router and no data fetching |
| Collapsible / Accordion / Tabs | Controlled panels. Content stays mounted |
| Skeleton / Progress / Spinner / Alert | Loading, progress, wait, inline notice |
| Banner | Site notice. Actions slot. The caller owns dismissal |
| Toast / ToastRegion | Temporary notice and a shared region. The queue stays with the caller |
| IconButton / EmptyState | Named icon button. Empty content and an actions slot |
| Badge / Avatar / Separator / Card / AspectRatio / Table | Mark, image, rule, surface, ratio, native table |
| Dialog / AlertDialog / Drawer / Popover / Menu / Tooltip | Dialog, confirm, side panel, anchored layer, menu, tip |
| ContextMenu / HoverCard | Context menu and link preview. The preview is not required content |
| Paper | Paper texture |

Each component has a demo, an English note, and a Chinese note.
The docs site discovers them from the source.
There is no second list.
Coverage is in [docs/component-roadmap.md](docs/component-roadmap.md).

## Tokens

`tokens.css` defines these on `.ui`.
Components read only these:

`--ui-bg` `--ui-fg` `--ui-muted` `--ui-faint` `--ui-line` `--ui-accent` `--ui-font-display` `--ui-font-text` `--ui-font-meta` `--ui-ease` `--ui-dur` `--ui-radius`

Color uses `light-dark()` and follows the system.
Set `data-theme="light"` or `data-theme="dark"` on the scope, or an ancestor, to force one.
`.ui` is a class, not the document.
`@froq/ui/tokens.css` is enough when a project wants the tokens without the components.
`pnpm check:tokens` fails if a variable is missing, or if a component reads one outside this list.

## Use

```ts
import '@froq/ui/style.css'
import { Choice, Toggle } from '@froq/ui'
```

```vue
<div class="ui">
  <Choice v-model="tone" label="Tone" :options="[{ value: 'quiet', label: 'quiet' }, { value: 'loud', label: 'loud' }]" />
</div>
```

Fonts are not in the package.
Components expect Instrument Serif, Geist, and Geist Mono.
Load them in the app, or the page falls back to system fonts.
Those faces are SIL OFL 1.1.

Nuxt:

```ts
export default defineNuxtConfig({
  build: { transpile: ['@froq/ui'] },
  css: ['@froq/ui/style.css'],
})
```

The package publishes source.
Vite compiles it.
The root dependencies use normal version ranges, not this workspace's `catalog:`.
A consumer that installs `file:vendor/ui` cannot see the catalog.
Dev tools may use a named catalog.

## Behavior that stays with the caller

Skeleton follows an explicit `loading` prop.
It does not wait for fonts, routes, or requests.
Use the default slot when the layout is known.
Use `width` and `height` when it is not.

Toast renders inside `ToastRegion`.
The queue, ids, and anything that must remain on screen stay with the caller.
`useAutoDismiss(active, { duration, paused?, onDismiss })` is exported from `@froq/ui/vue`.
Call it in setup.
A pause keeps the remaining time.
A new duration or a new activation resets it.
A duration that is not finite and greater than zero does not auto-close.

Calendar and DatePicker use a Gregorian `YYYY-MM-DD` string, or `''`.
They do not convert that string into a zoned timestamp.
The caller passes `locale`, `initialDate`, and `today`.
`parseCalendarDate`, `calendarDateBounds`, and `formatCalendarDate` come from `@froq/ui/core`.
DatePicker is a calendar button.
Use DateInput when the form needs a native date field.

Overlays use `reka-ui`.
The default portal target is the nearest `.ui`, so the theme stays.
`portal-to` must exist and carry the same tokens.
Do not portal into a `body` that has none.
A transform or clip on the scope can break a fixed layer.

Dialog and Drawer include a trigger.
For an external opener, set `:show-trigger="false"` and pass that opener's element as `return-focus`.
`disabled` does not disable the external button.
`useFocusReturn(open, target, captureFallback)` is exported from `@froq/ui/vue`.
It does not trap focus.
[docs/examples/ConsumerAdapters.vue](docs/examples/ConsumerAdapters.vue) shows the wiring.
It is not a migrated site and it is not a visual acceptance test.

`ContextMenu` exposes `close()` on the component ref.
`useContextMenuControl(disabled)` must run under `ContextMenuRoot`.
The menu is not a `v-model`.

## In another project

That project keeps its own copy in `vendor/ui` and commits it.
Dev and the remote build compile that copy.
The agent steps are in [AGENTS.md](AGENTS.md).
On install, also write the push, pull, and extract steps into that project's agent markdown.

## Add a component

Write the behavior in `src/vue/` first.
Then `src/components/<concept>/<Name>.vue`.
Export it from `src/index.ts`.
Add `<Name>.demo.vue`, `<Name>.md`, and `<Name>.zh.md` beside it.
`/components/<concept>` shows the demos.
`/components/<concept>/<name>` renders the note.
Group labels in the sidebar are not pages.
Concepts and components are.

## Commands

```bash
pnpm dev             # docs at http://localhost:3000
pnpm generate        # static files in dist/
pnpm deploy          # generate, then cf deploy
pnpm preview:deploy  # generate, then cf previews deploy
pnpm check           # lint, types, token contract
```

## Docs site

https://ui.froq.me

`docs/` is Nuxt Content.
The static output is `dist/` at the repo root.
It deploys to the Cloudflare Worker `ui`.
The Worker config is `cloudflare.config.ts`; the assets directory is in `wrangler.config.ts`.

Workers Builds (GitHub connection, no API token in the repo): `NODE_VERSION=22`, build `pnpm generate`, production `pnpm exec cf deploy`, preview `pnpm exec cf previews deploy`.

The docs live in the `docs/` subpackage, so root `cf deploy` does not run generate on its own.
That is why `deploy` is `pnpm generate && cf deploy`.
`docs` keeps `nuxt` in peerDependencies so root `cf deploy` bundles `dist/` instead of running `pnpm nuxt build`.

Queries run in the browser from the bundled WASM SQLite and SQL dump.
Do not use the `cloudflare_pages` Nitro preset.
A passing local generate is not a verified deploy.
See [the release audit](docs/release-audit.md).
CI installs from the lockfile.

## License

This package has no root license file.
The handwriting strokes in `src/core/signature/` are SIL OFL 1.1.
Copyright 2010 The Allura Project Authors.
See `OFL.txt` and `NOTICE.md` beside that data.

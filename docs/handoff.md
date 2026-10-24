# UI library handoff

## Current design status (2026-10-01)

The maintainer confirmed `1000o = 0froq/1000-observations` and accepted the current implementation as sufficient for now. All 50 components remain **AI Draft / awaiting manual design review**, not maintainer-designed or visually approved. The 100 sibling references record `designStatus: ai-draft`; documentation catalog, concept and detail pages show the shared badge. The homepage is now an editorial specimen with real local Choice/Toggle interactions and the discovered concept index. Site-wide Banner presents the translated WIP notice in normal flow above the header, with caller-owned content/actions/dismissal. No consumer migration or publication is implied.

## Delivered implementation

`@froq/ui` has 50 implemented components with sibling demos and English/Chinese API references. Logic is separated into framework-free `src/core`, unstyled Vue `src/vue`, and token-based `src/components`. The caller supplies `.ui`, fonts, routes, data, translation and request readiness. No fake placeholder components are exported.

Skeleton covers a whole reserved region. Known content can stay mounted hidden/inert; unknown content needs caller-provided dimensions. Static SSR navigation is not hidden behind a loading mask. Docs fonts use optional display and three primary preloads; slow cold visits can keep fallback rather than swap late.

Sidebar is the reusable multi-level component, with group headings, indentation/guides, gray selected frame and short accent edge, per-group selection transition and optional top-level folding. The docs wrapper only adapts locale/routes. Header route navigation remains separate from Sidebar layout.

Native controls preserve real attributes and submission contracts. Overlays reuse Reka focus/layer/placement rather than copy infrastructure. External Dialog/Drawer origins use showTrigger/returnFocus; ContextMenu exposes close() without remounting target content. Clipboard reset uses bounded timers and actual write outcomes. Date-only values remain ISO strings without local timestamp conversion.

## Open locally

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm dev
```

Use the URL printed by dev (normally http://localhost:3000). Component demos and references are at `/components` and `/zh/components`. `pnpm generate` emits the static documentation site in root `dist/`.

## Consume in another project

Follow root `AGENTS.md` to embed the complete repository as ordinary `vendor/ui` source with a `file:vendor/ui` dependency. The independent audit tarball is compile evidence, not the prescribed installation strategy. Do not publish to npm, add a remote git dependency, use submodules/link/aliases, or migrate consumers automatically.

```ts
import { Dialog, Sidebar, Skeleton } from '@froq/ui'
import '@froq/ui/style.css'
```

Use an outer element with `class="ui"`. Nuxt additionally sets `build: { transpile: ['@froq/ui'] }`; the stylesheet can be in `css`. Read sibling references for each component's labels, models and slots. Existing token themes can map the twelve documented variables; page colors/data are not library dependencies.

Representative caller-owned adapters are in `docs/examples/ConsumerAdapters.vue`. Six pinned source/API inventories and resolved dependency versions are in `docs/consumer-mapping.md`; the maintainer confirmed `1000-observations` as `1000o` on 2026-10-01. No consumer was migrated.

## Evidence and limitations

See `docs/release-audit.md` for exact package hashes, commands and source checks. Full lint/types/token checks, actual tarball Vite compilation and independent Nuxt client/server compilation passed. All package source files were compared with current workspace at the recorded checkpoints. Generated HTML is inspected as static artifacts, not browser behavior.

No UI tests or browser/computer-use validation is performed, per project instructions. Therefore manual acceptance is still pending, not silently replaced by compilation. No commits, pushes, publication or deployed-site acceptance are claimed. The dirty worktree is preserved.

## Finite manual acceptance checklist

Each line is pending. Check the corresponding live demos in both themes; report failures with route, expected behavior and actual behavior. Do not wait 24 days to check timer overflow: set resetAfter to 2147483648 and verify the result does not disappear immediately, then reset/leave the demo.

1. Cold/cached refresh and failed font request: usable SSR text remains; no blanket skeleton; Sidebar and content do not jump through late font replacement. Check Chinese and a narrow viewport.
2. Sidebar/header: nested selection, group separation, top-level fold, frame transition within a group, no transition between groups; header routes and modified links remain functional.
3. Skeleton: loading/loaded region dimensions stay stable; hidden controls cannot receive keyboard focus; reduced motion disables pulse.
4. Forms: keyboard operation, disabled/readonly/required/name, submission and explicit reset; searchable single/multiple clear, IME and input focus after clear; date bounds/locale/disabled days.
5. Modal/anchored layers: focus entry/trap/return, outside/Escape policies, nested layers, missing external opener, rapid reopening, long content and themed portals.
6. ContextMenu: keyboard and right-click; child local state survives disabled changes; long press followed by disable/close does not reopen; reenable alone does not reopen; consumer scroll-close and submenu navigation work.
7. Clipboard/toast: real denial versus success, repeat/pending/disposal, label width, large reset delay; toast announcements, pause/resume, focused Escape and dismissal focus.
8. Display/disclosure: image failure/stale-source fallback, fixed media reservation, table overflow/naming, persistent hidden panels, close-from-panel focus return and Tabs keyboard/RTL.

The implementation handoff is ready for these checks. Repository identity is confirmed; manual design/interaction acceptance remains pending. The maintainer has accepted the current draft milestone for now, not approved every design. Do not invent additional components or repeat identical builds to replace that distinction.

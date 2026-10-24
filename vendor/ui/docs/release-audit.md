# Release audit — 2026-10-01

Banner iteration: the library now has 50 public components and 100 bilingual references. `feedback/Banner` adds a site-wide named notice region, message/actions slots and optional caller-owned dismissal. The docs default layout uses it for a persistent translated WIP notice above a positioned page wrapper. Full `pnpm check` passed. Browser/manual acceptance and new production/package artifacts are not claimed; the earlier 49-component compilation checkpoints below are historical.

Status: implementation and static distribution were verified at the checkpoints below; full design acceptance is not proven. This is an audit, not a release announcement. Other repositories are read-only. No UI tests/browser automation, publication, commits or pushes were performed.

Current draft milestone: the maintainer confirmed `1000o = 1000-observations` and accepted the current implementation as sufficient for now. All 49 components are explicitly AI Draft, pending manual design review. This iteration added status to all 98 reference frontmatters, shared documentation badges and the redesigned homepage. `pnpm check`, scoped zero-warning documentation lint and `git diff --check` passed. No production generation or package rebuild was repeated: earlier HTML and tarball hashes below remain historical artifacts and do not include these new reference/homepage edits.

## Requirement evidence

| Requirement | Authoritative current evidence | Result / remaining gate |
| --- | --- | --- |
| Shared region Skeleton rather than descendant masks | `src/components/feedback/Skeleton.vue` and `skeleton.css`: one surface, persistent hidden/inert slot, explicit sizes, reduced-motion policy | Implemented; actual geometry, focus exclusion and theme require manual acceptance |
| Font loading separate from content readiness | `docs/app/assets/css/fonts.css`: all 15 faces optional; `docs/app/app.vue`: three primary font preloads; no global font/page-loading mask remains | Source and generation verified; cold/cached/failed-font layout remains manual |
| Reusable layered library | `src/core`, `src/vue`, `src/components`; root and behavior exports; styles read twelve contract tokens; caller supplies `.ui` | Token/source checks pass; no business router/store/i18n in library implementations |
| Sidebar shared hierarchical/foldable navigation | `src/components/navigation/Sidebar.vue`, `src/vue/useSidebar.ts`, docs Sidebar route adapter | Extracted; fold, nested links, per-group transitions and route/locale behavior manual |
| Mainstream baseline coverage | 49 root components cover the baseline and all basic families listed in `component-roadmap.md` | Every implementation has demo/EN/ZH siblings; count is not behavioral proof; excluded advanced/domain features remain excluded |
| Modal many-origin use | Dialog/Drawer `showTrigger`, `returnFocus`, cancelable autofocus; shared `useFocusReturn`; typed consumer adapters | Source/types and independent compilation pass; nested focus/rapid reopen/unavailable opener manual |
| ContextMenu target persistence and caller dismissal | Non-keyed root, `useContextMenuControl`, private renderless state wrapper, exposed `close()` | Source/types/current compiled package pass; no false controlled model or timeout-cancellation claim; long-press/default-prevention/focus manual |
| Six-repository mapping | `consumer-mapping.md`: pinned source revisions, actual interaction units, API adapters, domain exclusions and actual root lockfile versions | Lockfile ranges/resolutions compatible; `1000o` identity confirmed by maintainer; actual installed consumer builds and migration acceptance not proven |
| External package consumption | Current tarball independently installed in Nuxt 4.5.2/Vue 3.5.41; public entries, token CSS and framework-free/behavior entry imports | Client and server compilation pass; all 238 src files and README match; not UI behavior or a real external-site migration |
| Discoverable bilingual docs without duplicate demo list | Source scanner + latest `pnpm generate`; direct inspection of 49 sibling sets and 98 generated component identities | Passed this iteration, including ContextMenu methods/demo; private ContextMenuState has no public route |
| Reproducible install/check | `pnpm install --frozen-lockfile --ignore-scripts` passes; workflow now uses frozen lockfile | Lockfile consistency verified; local command does not prove CI runner result |
| Complete usable release | All requirements above plus actual manual behavior acceptance | Not proven; do not mark the goal complete from compilation/static HTML alone |

## Current build / distribution evidence

- Latest full source check after the tooling correction below: `pnpm check` passed (root/docs lint and types, twelve-token contract) under ESLint 10.11.0. After any code/config change, refresh before final claim.
- Current docs generation: 106 content files, 280 routes, exit 0. All 49 implementation/demo/EN/ZH sets and 98 generated identities inspected. Current ContextMenu English/Chinese methods and demo controls present. Private helper route absent. No UI rendered or operated for this inspection.
- Last actual tarball: `/tmp/froq-ui-contextmenu-pack-KKgCRf/froq-ui-0.1.0.tgz`, SHA-256 `f19df9a82f981f98fba1689e02e8e59c60b5ce25299f9400416b77268c70bb1b`. Independent `/tmp/froq-ui-consumer-gjpvsv` installed it and compiled the full namespace plus adapters with Vite 8.3.1/Vue 3.5.43 and no direct TypeScript dependency. ContextMenu/helper/private-wrapper source copies match. README has since changed; this hash is historical, not a claim of byte-identical current package.
- Full-namespace bundle size is not an individual component's cost. Actual consumer builds, tree-shaking and deployment budgets must be measured in those consumers, not inferred here.
- Independent fixture subsequently switched to Vue 3.5.41 (personal site's pinned version); install and full-namespace/adapter Vite compilation passed with the same last tarball and no direct TypeScript dependency. This is compile compatibility evidence for both observed Vue versions, not an external-site migration or Nuxt integration build.

### Current independent Nuxt package check

New current artifact: `/tmp/froq-ui-nuxt-pack-ZLx3vE/froq-ui-0.1.0.tgz`, SHA-256 `0de096e685c88a5061a93d5c9610e8af75cddd534a675fa969b953a5f2c50d6f`. Independent project `/tmp/froq-ui-nuxt-consumer-xeck46` depends on the actual tarball, Nuxt 4.5.2 and Vue 3.5.41, with no direct TypeScript dependency, no workspace alias and no Content module. Config is the documented `build.transpile: ['@froq/ui']` plus stylesheet import.

Its plugin retains namespace imports of `@froq/ui`, `@froq/ui/core` and `@froq/ui/vue` in the client/server builds; it does not mount or render library controls. `pnpm install --ignore-scripts`, `pnpm exec nuxt build` and subsequent frozen-lockfile install all passed. Nuxt compiled 857 client modules and 786 SSR modules and produced its node-server output. This validates all public runtime entries and skins under external Nuxt compilation, not focus/keyboard/SSR control rendering or any production consumer deployment.

All 238 packaged source files and README were directly compared with workspace bytes; all five exported paths exist, runtime dependency protocols are portable ordinary ranges. Previous tarballs remain historical evidence, not the latest package. The Nuxt fixture is temporary and not a migrated consumer repository.

## Deployment / dependency boundaries

The documented command is `pnpm generate`, with output `dist/`, not a server deployment. Current artifact contains HTML/payloads, all four public collection SQL dumps and browser SQLite WASM/worker assets; no `_worker.js` is present. Installed Nuxt Content 3.16.1 Cloudflare setup prints a D1 warning when switching its server-side database configuration. Static generation succeeds. This does not prove a missing D1 binding breaks the static output, nor prove the deployed site works.

[Official static hosting documentation](https://content.nuxt.com/docs/deploy/static) specifies prerendering and browser WASM SQLite. [Official Cloudflare Pages server documentation](https://content.nuxt.com/docs/deploy/cloudflare-pages) requires D1 for its server preset. Retain this distinction; do not provision a database or change deployment architecture merely to hide a warning. The remote Pages settings and production behavior have not been checked this iteration.

Current local resolved runtime: Vue 3.5.43, Reka UI 2.10.5, `@internationalized/date` 3.12.4, Nuxt 4.5.2. Root package ranges are ordinary portable dependencies; development catalogs are not runtime dependencies. Manifest compatibility is weaker than a consumer lockfile/build. ESLint peer/tooling and Nuxt/h3/DevTools warnings remain separate from package runtime acceptance; do not blanket-upgrade unrelated tools without examining their actual constraints.

Pinned consumer root lockfiles resolve Nuxt 4.5.2 throughout, Vue 3.5.41 for personal site and 3.5.43 elsewhere; all satisfy the library peer. Root sampled three of the six mechanical-agent results against original importer lines. This is stronger than manifest-only compatibility, but not an actual consumer install/build.

Tooling correction: installed Antfu 9.5.1 brings Unicorn 74.0.0 (ESLint peer >=10.4), incompatible with the old ESLint 9.39.5. Antfu, Nuxt ESLint, Stylistic and formatter peers inspected all accept ESLint 10. Changed only the ESLint catalog range to ^10.9.1; pnpm resolved 10.11.0. Local Node 22.23.2 meets its ^22.13.0 engine and CI's Node 22 line is compatible. Full `pnpm check` and frozen-lockfile installation passed after correction. Remaining installation peer warnings are transitive cac (CLI/@bomb.sh/tab) and oxc-parser/unplugin (Content/nuxt-component-meta/unctx), not Unicorn; no broad overrides or runtime upgrades were made to conceal them.

Documentation dev started and reached client/server/Nitro ready; a concurrent same-workspace server already occupied port 3000, so the newly started instance used 3002 and was stopped after inspection. Existing port-3000 process was retained. Production ContextMenu files survived dev startup. Nuxt also reports unresolved module-added optimizeDeps entries alongside DevTools hook warnings; record/investigate those rather than claiming a clean runtime from the build messages.

## Manual acceptance handoff

### Latest native-control / clipboard source review

Reviewed FileUpload, NumberInput, DateInput, Slider, TextInput, TextArea, Select, RadioGroup and FormField with shared useControlAttrs and relevant references. Wrapped native controls route class/style to labels and other attrs/listeners to the actual control; RadioGroup deliberately uses fieldset attrs and native radio name/form/required. FileUpload reports File[] rather than a fake writable file model; consumer synchronizes native form reset and Vue state. Select documents its single-value-only contract; FormField supplies one control's IDs/ARIA rather than duplicating labels around already-labeled controls. This is source contract review, not native browser validation or keyboard acceptance.

Found a clipboard reset boundary: positive finite resetAfter was passed directly to native setTimeout, which overflows beyond the signed 32-bit delay limit. useClipboard now chunks the captured delay, subtracts actual monotonic elapsed time, and cancels the current chunk on another copy or scope disposal. No onMounted requirement was added (useClipboard still works in an effect scope). Bilingual CopyButton references describe duration capture, chunking and browser throttling. Source has changed since the independent Nuxt tarball above; refresh package/docs before final delivery. Manual checks include ordinary/disabled/pending copying, denial, repeated copy, unmount and a very large delay that must not reset immediately.

After correction, full `pnpm check` and whitespace checks passed. Refreshed tarball `/tmp/froq-ui-clipboard-pack-7d9S5i/froq-ui-0.1.0.tgz` SHA-256 `3659724e1964d088a27f73d8cd83a28bb37dbc6169dbe0fc3bb011021aafdc75` is now installed in the independent Nuxt fixture above; both client and SSR builds passed. Changed helper and both references compare equal to the installed package. No UI/timer interaction test was performed. Generated docs have not yet been refreshed for these two paragraphs; earlier static-generation evidence is historical for this change.

Final handoff iteration refreshed the generated docs: 106 files/280 routes, exit 0; all 49 implementation/demo/bilingual sibling sets and 98 generated component identities checked, including both new CopyButton timer paragraphs. Private helper routes remain absent. `docs/handoff.md` is the finite implementation/use/manual-acceptance handoff, not a second implementation plan. No additional source change invalidated the latest tarball. Manual acceptance and candidate identity are the remaining external evidence gates; do not claim completion while those explicit gates are missing, and do not manufacture progress by repeating unchanged checks.

Per AGENTS, no UI tests or browser/computer-use validation is permitted. The following are still not accepted:

- Loading: known/unknown geometry, hidden keyboard controls, whole-region skin, theme/reduced motion; cold/cached/failed-font refresh without late swaps.
- Navigation: nested/folded Sidebar, selected frame transitions within groups, group headings, header routing, locale and modified links, narrow layouts.
- Forms: native attributes/submission/required/read-only, single/multiple clear state, disabled options, keyboard/IME, clear focus, date locale/constraints/form reset.
- Overlays: entry/trap/return focus, nested layers, prevented dismissal, external origins/removal, rapid reopen, long-press disable/close/default-prevented gestures, popup placement and scoped portal themes.
- Feedback/data: clipboard denial/pending/unmount, toast announcements/pause/Escape/focus, progress names, avatar failures/stale events, table semantics and overflowing media.

Actual external migrations and publication are not authorized by this goal. A usable source library and migration-ready APIs do not justify modifying six projects or claiming their production acceptance. Continue the audit and close evidence gaps within the current repository; ask only when an actual missing user decision or manual gate prevents further meaningful work.

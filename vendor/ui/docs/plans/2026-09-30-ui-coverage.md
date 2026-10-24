# UI coverage and loading Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish evidence-backed v0.1 scope, implement reusable loading primitives, and define v1.0 coverage for six consuming repositories.

**Architecture:** Keep framework-free behavior in `src/core`, unstyled Vue behavior in `src/vue`, and token-based components in `src/components`. Consumers own fonts, requests, routes, content and layouts. A shared Skeleton handles visual loading only; it must not infer readiness from global hooks.

**Tech Stack:** Vue 3.5, TypeScript, CSS, Nuxt documentation, pnpm.

---

## Constraints

**Pause checkpoint (2026-09-30):** At maintainer request, finish Calendar/DatePicker and then pause the active goal. Current namespace is 49 real components; source checks, independent consumption and static generation passed, not manual UI acceptance. Resume with six-repository interaction mapping and release audit as scoped below. Details/evidence are in `docs/component-roadmap.md`; do not shrink completion to the implemented component count.

**Latest pause checkpoint (2026-10-01):** Resumed, completed a bounded distribution audit, and paused again at maintainer request. The current 49-component tarball contains byte-identical source, complete sibling demos/references and valid entries/runtime ranges; an independent no-TypeScript Vite consumer compiled the actual tarball. No new UI implementation or UI acceptance. Next: six-repository interaction/API mapping, deferred source/API issues, deployment warnings and final handoff. Goal remains unfinished; see the latest roadmap checkpoint for artifact paths and limits.

**Resume (2026-10-01):** Maintainer resumed the full goal and revoked further pausing. Current source/API mapping is in `docs/consumer-mapping.md`; circle's updated upstream now includes dialog/tabs. Next implementation: support controlled external/many-trigger modal usage without adding an unrelated trigger, then compile representative landing, lig custom-behavior and circle/person-site modal/tab adapters. Continue the existing release audit; no external repository mutation or arbitrary component-count expansion.

**Current frontier (2026-10-01):** External-trigger Dialog/Drawer plus focus-return behavior are implemented; representative adapters and latest tarball compile independently. Combobox clearing focus and single-value clear-state typing were corrected; latest full source checks and 280-route generation passed. Continue ContextMenu lifecycle/API-limit review, dependency/deployment audit and final requirement-by-requirement handoff. Actual consumer migration/version resolution and manual UI acceptance are not claimed. Goal remains active; latest artifact/evidence and manual behaviors are recorded in the roadmap.

- Work in the current dirty worktree; preserve existing changes. No commit/push without instruction.
- No UI tests or browser/computer-use testing. Type checking, lint and source inspection are allowed; user checks actual behavior.
- Maintainer authorized autonomous implementation after the initial concept discussion; use `feedback` for loading/status and `disclosure` for folding primitives.
- Read other repositories only. The goal is library coverage and migration readiness, not permission to migrate them now.
- Planned components are documentation placeholders, never dummy package exports.

### Task 1: Inventory and scope

1. Read package manifests and actual component usage in `0froq.github.io`, `void`, `gallery`, `lig`, `circle` and the candidate `1000-observations` (confirm whether this is `1000o`). Record source paths and commit identities.
2. Compare official MUI, Chakra and Reka component catalogs. Distinguish a shared primitive from a business view.
3. Create `docs/component-roadmap.md`: named v0.1 components, current status, repository evidence, v1.0 backlog and migration gates.
4. Inspect a small sample of Luna's inventory against actual source before using it. Do not redo the whole inventory.

### Task 2: Shared Skeleton

Files: `src/components/feedback/Skeleton.vue`, `skeleton.css`, `Skeleton.demo.vue`, `Skeleton.md`, `Skeleton.zh.md`; `src/index.ts`, `src/style.css`.

1. Implement `loading` (default true), `animation` (pulse or false), `shape` (block, text, circle), and optional `width`/`height` CSS lengths or pixel numbers.
2. A default slot preserves the real region's layout without making hidden controls focusable or available to assistive technology. Without content, caller reserves the dimensions; no invented item count.
3. One full-region surface, not one mask per descendant. Reduced motion disables pulse; no width/height transition or global font/router dependency.
4. Provide a fixed-size demo that toggles loading without changing dimensions, plus English/Chinese API documentation.
5. Check touched files with ESLint; run `pnpm typecheck` and `pnpm check:tokens`. User manually checks loaded/loading dimensions, hidden keyboard controls, reduced motion and both themes.

### Task 3: Documentation integration and fonts

Files: `docs/app/assets/css/site.css`, `docs/app/plugins/loading.client.ts`, `docs/nuxt.config.ts`, explicit consuming regions where actual data loading exists.

1. Remove the blanket descendant-mask CSS and font/page-loading data attributes. Do not hide already usable SSR content during route changes.
2. Integrate Skeleton only at actual loading boundaries with stable geometry. Static SSR navigation is not a data-fetch skeleton.
3. Treat font replacement separately: retain all existing self-hosted faces, use optional display and preload the three primary Latin assets via Vite URL imports in `docs/app/app.vue`. Document that slow cold visits can retain fallback. Do not claim Skeleton fixes font layout shifts.
4. Verify source/build checks; provide manual cold refresh, cached refresh, font failure, locale and route-switch checklist.

### Task 4: v0.1 implementation batches

1. Freeze the evidence-backed list before growing the library. Existing exports are not release-ready merely because their names exist.
2. Complete missing API documentation and baseline semantics of existing controls, then implement the agreed priority gaps one concept at a time.
3. Each component needs a real implementation, exports, demo, bilingual reference, token compliance and a consumer-use example.
4. Keep roadmap statuses honest: planned, implemented/source-checked, or manually accepted. Do not equate a command exit code with visual acceptance.

#### CopyButton batch (existing button concept)

Files: `src/vue/useClipboard.ts`, `src/vue/index.ts`, `src/components/button/CopyButton.vue`, `copy-button.css`, `CopyButton.demo.vue`, `CopyButton.md`, `CopyButton.zh.md`, `src/index.ts`, `src/style.css`.

- Consumer passes text and idle/copied/error labels; optional pending label, disabled and reset duration. No business or translation dependency.
- Actual browser write result determines status; unavailable or denied clipboard access is failure. Pending state prevents concurrent writes. Scope disposal clears timers and ignores a late result.
- Reserve all label widths using CSS grid, not JavaScript measurement. Reuse Button's existing skin, no font-weight changes or loading geometry animation.
- Expose `copy(text)` and `error(Error)` component events. Browser clipboard calls are made only from activation, never SSR/setup.
- Commands: scoped `pnpm exec eslint` (expected no errors), `pnpm typecheck` (expected library and docs pass), `pnpm check:tokens` (expected 12 definitions).
- Manual checks: click/Enter/Space, clipboard denial/unavailability, disabled state, rapid clicks, unmount during write, reset timeout and long translated labels. No automated UI tests.

### Task 5: v1.0 acceptance

#### Calendar and DatePicker batch

Files: `src/core/date.ts`, `src/core/index.ts`, `src/components/date/Calendar.vue`, `DatePicker.vue`, sibling demos/EN/ZH references, `date.css`; package/lockfile, root exports/style and README/roadmap.

- Use plain Gregorian `YYYY-MM-DD` string models (`''` means unset), not timestamps. Framework-free parsing/formatting uses the installed `@internationalized/date` package, added as an ordinary runtime range, never catalog. Invalid nonempty dates or inverted bounds fail explicitly rather than silently bypass constraints.
- Calendar adapts one-month Reka behavior, localized month/weekdays, min/max and caller-disabled dates, readonly/disabled, locale/RTL, fixed six-week geometry, toggle deselection policy, and an explicit initialDate for SSR-safe empty-state month. Do not claim year/range/time editing. Expose a small focus operation for the composed picker, preferring an enabled roving day then enabled navigation control/root.
- DatePicker composes the same Calendar with existing Reka Popover/portal behavior, a labeled date-summary button, localized date display, clear/close controls, controlled popup state and optional hidden ISO form value. Native required/constraint validation remains DateInput or caller-owned validation. No second calendar or route/date business store.
- Confirm core leap-day/invalid-date and UTC-format invariants with read-only CLI calls; no UI tests/browser automation. Verify lint, types, 12 tokens, independent source-package installation/build, demos/references and static generation. List keyboard/disabled dates/locale/portal/focus/form payload manual checks.

#### Toast batch

- Add `feedback/ToastRegion` (shared provider/viewport) and `feedback/Toast` (controlled message). No global message store, business request or success inference. Caller owns queue and IDs.
- Reuse Reka announcements/viewport/hotkey/pause context, disable swipe until a token-contract-compatible interaction is implemented. Use a local unstyled `useAutoDismiss` for cancellable timers: inspected Reka 2.10.5 does not clear its finite close timeout on unmount. Pass zero to its root duration to avoid competing timers.
- Support translated region/viewport/close names, foreground/background announcement sensitivity and an optional ignorable action with alternative-action text. Closing focused content moves focus to the viewport; callback does not await asynchronous work.
- Installed root Escape listener is document-wide; ignore that model-close path without canceling unrelated page Escape events, and handle focused toast Escape on its own root.
- Verify source/types/tokens, independent source-package compilation and generated references; leave actual announcements, focus, pause timing and placement for manual acceptance. No UI tests.

#### Combobox batch

- Add one searchable select component with single/multiple selection, using the installed Reka behavior. Selection model, input-text model and popup model stay separate.
- Consumer supplies labels/options; custom filtering, remote requests, validation and stale-request handling remain outside the library. Empty values clear selection; arbitrary typed text never becomes a selected value.
- Reuse control attribute routing and scoped portal targeting. Add token-only skin, single/multiple demo and bilingual API references; verify lint/types/tokens and independent source-package compilation, without UI tests.
- Generation audit found dev clears production output because Nitro output paths were shared. Restrict the custom dist path to `$production`; verify generation and that subsequent dev startup preserves generated pages.

#### ToggleGroup batch

- Add `toggle/ToggleGroup.vue`, `toggle-group.css`, sibling demo and bilingual references; export from src/index.ts and import skin from src/style.css.
- Named group of pressed buttons uses existing ChoiceOption values, single string or multiple string-array model, explicit type/orientation/dir/loop/disabled. Display normalization never rewrites parent model. Reka supplies focus navigation, while activation alone changes pressed values.
- Normal font weights, gray segmented surface and short accent underline; disabled item/group behavior. Styled wrapper attrs stay on wrapper, other attrs on primitive group. No router, request or native required-radio promise.
- Source lint/type/token and independent consumer compilation; manual checks single clear/multiple values, mode changes, disabled items, keyboard/RTL/loop, label slots and narrow wrapping. No UI tests/browser operations.

#### ContextMenu and HoverCard batch

- Add `overlay/ContextMenu.vue`, `HoverCard.vue`, sibling demos/references and token skin. Share recursive command items with DropdownMenu via `_internal/MenuItems.vue`, switching the public primitive family rather than duplicating recursion.
- ContextMenu provides a focusable named group target, native context/long-press opening and explicit Shift+F10/Menu key bridge at the focused target's bounds. Emits openChange and cancelable select; Reka's root has no controlled open input, so do not invent a nonfunctional v-model. Disabled restores native context handling.
- HoverCard wraps a real link, with a controlled boolean open model, nonessential read-only preview, explicit disabled/delays/placement and themed portal. Ignore dependency state updates after wrapper disposal. Touch follows link navigation; preview is not an essential accessible dialog.
- No private dependency imports or new tokens; keep business actions/routes/fetching outside. Static source/types/token and independent distribution checks only; manual menu keyboard, pointer travel, disabled/native behavior, preview delays, disposal, themes and clipping checks remain explicit.

#### Drawer and AlertDialog batch

- Add `overlay/Drawer.vue`, `AlertDialog.vue`, sibling demos and bilingual references. Export both; extend existing overlay CSS. Declare Drawer props locally while forwarding them to Dialog. An attempted imported full props interface failed in the independent consumer without TypeScript; keep local AST declarations rather than adding a new consumer build requirement.
- Drawer composes Dialog with left/right/bottom skin, forwards trigger/body/footer slots only when supplied, shares portal/dismissal/focus behavior. No second focus layer, swipe gestures or copied dialog markup.
- AlertDialog uses Reka's actual alert-dialog root/content/title/description/cancel, requires response labels and explanatory text. Cancel gets safe initial focus, outside clicks do not dismiss, Escape remains available. Native confirmation button emits a cancelable click; default closes synchronously, preventDefault keeps it open for caller-owned asynchronous work. Pending disables confirmation, not cancel/Escape.
- Reuse nearest themed portal target, keep trigger SSR-visible, unmount closed content, token-only skin and normal font weight. No new loading/readiness store.
- Source lint/type/token and consumer build checks, bilingual generated artifact checks. No UI tests/browser automation. Manual checks: focus entry/trap/return, side placement/scroll, outside/Escape policies, pending/prevented confirmation, portal theme and nested dialogs.

#### Breadcrumb and Pagination batch

- Add `navigation/Breadcrumb.vue`, `Pagination.vue`, sibling demo/reference files; append token-only skin to `navigation.css`. Export both and their typed slot props through the public entries.
- Breadcrumb uses ordered list semantics, required landmark label, existing route-neutral NavigationItem, optional current identity (otherwise last item), real anchors only for supplied hrefs, and a typed link slot for router adapters. No state/model or inferred paths.
- Pagination uses native buttons for data-page changes or consumer-generated real hrefs for navigation. Required landmark/previous/next labels and pageLabel function keep translation outside. Numeric model is one-based, display is normalized without rewriting parent state. Zero pages disables previous/next and has no page entries.
- `src/core/pagination.ts` generates a bounded current-page window plus first/last and inert gap markers; no DOM/Vue. No copying Reka infrastructure for a native list. Guard prevented/modified link clicks and disabled activation; no routing/fetching.
- Commands: scoped ESLint, `pnpm check`, static export/reference audit and independent consumer Vite build. No UI tests/browser automation. Manual checks: breadcrumb current/link adapter, pagination extremes/disabled/invalid state, modified clicks, narrow wrapping, translated labels and native keyboard.

#### Tooltip and command menu batch

- Add `overlay/Tooltip.vue` and `DropdownMenu.vue`, sibling demos/references, and private recursive `_internal/DropdownItems.vue`. Extend existing overlay CSS; export `MenuItem` as a shared type.
- Tooltip wraps one focusable trigger with plain text description, boolean open model, disabled/delay/placement options. Each instance owns its provider; no claim of globally shared skip timing. No interactive tooltip content.
- DropdownMenu takes consumer-owned recursive command items, disabled flags and separator-before hints. Item selection emits the original cancelable event; no router, action execution or business store. Nested menus share the caller's themed portal target.
- Reuse Reka keyboard/focus/placement semantics and `usePortalTarget`. Attrs target root content, trigger slots must forward DOM attributes/events. Keep ordinary font weights and token-only skin.
- Source lint/types/token checks and independent source-consumer build. Manual checks: trigger focus/hover, Escape, disabled controls, submenu arrows, typeahead, prevented selection, RTL, clipping/theme scope and SSR hydration.

#### Display and action batch

- Add `button/IconButton.vue`, `feedback/EmptyState.vue`, and `display/{Badge,Avatar,Separator,Card,AspectRatio,Table}.vue`. Every public component gets sibling demo and bilingual API references; export all from `src/index.ts`, import `display/display.css` and `button/icon-button.css` from `src/style.css`.
- IconButton reuses Button, requires accessible label, forwards native attributes, hides decorative icon slot. EmptyState is consumer-owned empty content/actions, not an automatic live region.
- Badge is noninteractive text with muted/accent tone. Separator is decorative by default, optional named semantics through native attrs and horizontal/vertical orientation. Card uses header/body/footer slots, no business or page layout.
- Avatar composes Skeleton around a 40px image region, requires accessible label/fallback, ignores stale image events, resets on source changes and has a visible fallback after image failure. Consumer can override CSS dimensions without a new token contract.
- AspectRatio reserves positive ratio geometry, cover/contain media skin, and one default slot. Table is semantic HTML with caption, typed columns/rows, explicit row-key function, cell/header/empty slots and scroll wrapper; no sort, filtering, virtualization or business schema.
- Validate exports/reference presence, source/type/token/lint checks and docs production generation. No UI tests; manual check themes, icon names/focus, avatar load/error/cache change, ratio crop, table scroll/cell slots and separator semantics.

#### Native forms batch

1. Add `src/components/field/NumberInput.vue`, `DateInput.vue`, `Slider.vue`, `FileUpload.vue`, `FormField.vue`, plus sibling demos and bilingual references. Root exports in `src/index.ts`; common skin in `src/components/field/form.css`, imported from `src/style.css`.
2. NumberInput is a native number input with `number | undefined` model (empty/invalid reads as undefined), min/max/step props, optional native validation rather than clamping away user input. DateInput is a native date input with date-only ISO string model; browser owns localized presentation, never convert to UTC Date.
3. Slider uses a native range input with finite normalized min/max/step and clamped displayed value. Browser handles step alignment; invalid external models are not silently rewritten. Native attrs still carry form identity/disabled and accessible formatting. It is a single thumb; range sliders remain a separate need.
4. FileUpload uses a visible native file input, emits selected `File[]`, permits resetting through resetKey/clear, forwards accept/multiple/name/required/disabled. Cannot programmatically populate its file selection; accept is a hint, not validation or upload.
5. FormField composes a real label, generated stable control ID, description/error IDs and typed slot control props. Required/error state describes the control; no validation engine, business schema or child DOM queries.
6. Keep `useControlAttrs()` render-called forwarding for label wrappers. Do not infer dynamic native attrs with computed/watch. Native controls handle keyboard and mobile affordances.
7. Commands: `pnpm check` (source lint/types/token contract), `pnpm generate` (all docs routes), independent `file:` consumer Vite build (distribution). No UI tests or browser operations. Manual checks: clear/invalid numeric draft, native bounds/required/name and form reset, localized date display, range keyboard/step, file selection/cancel/reset and label/error association.

8. Add `radio/RadioGroup.vue` with native fieldset/legend and radio inputs: optional string model, label/options, name, disabled, required and optional external form association. Native radio name groups keyboard and submission; default generated name isolates groups. Preserve Choice/ChoiceCircle as their existing animated word controls, do not pretend their button radios already have native constraint validation.

#### First v1.0 expansion batch

- Tabs: controlled string value, disabled items, automatic/manual activation, horizontal/vertical orientation, roving keyboard focus, stable IDs, persistent hidden panels. No routing. Reuse framework-free key indexing; keep focus behavior unstyled in `src/vue`.
- Accordion: compose Collapsible, string-array model, single/multiple opening, disabled items and label/content slots. No copied disclosure DOM or height animation.
- Progress: native progress semantics with an explicit accessible label; undefined value means indeterminate. Finite values clamp to a positive maximum. Reduced motion disables decorative movement.
- Spinner: status with required accessible label, decorative CSS ring, fixed geometry, reduced motion.
- Alert: consumer-owned title/content, status/alert/off announcement policy, optional dismiss label and dismiss event; no timers/store.
- Each receives demo, bilingual source-matched reference, export and token-only CSS. Source checks only, then production generation; manual behavior acceptance remains explicit.

#### Overlay foundation

- Add `reka-ui` as a runtime dependency; use its unstyled Dialog and Popover behavior rather than hand-writing focus/layer/placement infrastructure. Official APIs and installed source are the reference.
- Dialog: boolean model, required title/close label, optional description, trigger/default/footer slots, dismissal policy, content attributes. Modal focus and teardown are delegated to Reka.
- Popover: boolean model, required accessible label/close label, trigger/content slots, side/alignment/offset, collision handling. Non-modal, not a menu or tooltip.
- Portals default to the closest consumer `.ui` so token inheritance survives, never append `.ui` on a library root. Explicit targets require the caller to supply token/theme scope. No Reka-specific CSS variable becomes a new skin token.
- Closed overlay content unmounts. Trigger remains SSR-visible; portal content is client-mounted by the dependency. No compatibility or keyboard acceptance claimed from type checks alone.

Collapsible batch files: `src/vue/useDisclosure.ts`, `src/vue/types.ts`, `src/vue/index.ts`, `src/components/disclosure/Collapsible.vue`, `collapsible.css`, `Collapsible.demo.vue`, `Collapsible.md`, `Collapsible.zh.md`, `src/index.ts`, `src/style.css`.

- Boolean `v-model` controls open; required label supplies fallback trigger text; disabled prevents trigger activation, not parent-driven state changes.
- Native button provides Enter/Space behavior. Trigger and panel IDs use Vue `useId`; custom trigger slot receives complete button props.
- Keep closed content mounted but hidden/inert. Closing while focus is inside returns focus to the trigger before hiding; closing elsewhere must not steal focus.
- No height animation, route, content model or business store. Reuse a small `useDisclosure()` state behavior without skin.
- Source/type/token/lint checks and bilingual demo/reference. User manually checks controlled open, custom trigger, keyboard, disabled, focus return and both themes.

Navigation batch files: `src/vue/useNavigation.ts`, `src/vue/types.ts`, `src/vue/index.ts`, `src/components/navigation/Navigation.vue`, `navigation.css`, `Navigation.demo.vue`, `Navigation.md`, `Navigation.zh.md`, `Sidebar.vue`, `src/index.ts`, `src/style.css`, `docs/app/components/SiteNav.vue`.

- Flat route-neutral items (`value`, `label`, optional `href`) use the same identity as Sidebar; nested links still belong in Sidebar.
- A shared activation helper handles plain versus modified/default-prevented clicks. `current` controls page/location semantics, not state ownership.
- Docs adapter maps translated configuration and locale URLs. Confirmed routes control active section. Internal NuxtLink removes the generic click handler; external anchors stay external.
- Preserve the existing header placement and mobile gap/justification classes. Do not extract page/header layout into the library.
- Typecheck and scoped lint; user checks homepage nav, nested component/doc page state, Chinese locale, browser modified clicks, external GitHub link and narrow wrapping.

- Mainstream basic form, navigation, disclosure, overlay, feedback and data-display coverage is explicitly mapped, not inferred from component count.
- For every named repository, map actual replaceable controls to library APIs and list unsupported interactions, framework adapters and exclusions.
- Most pluggable controls must be replaceable without importing router/store/domain code into the library. Define the denominator from the inventory before measuring coverage.
- Complex overlays require keyboard/focus/dismissal/SSR behavior, not cosmetic shells. Dependency choices are a separate architectural decision.
- Goal remains active until requested deliverables and implementation scope are supported by current evidence.

## Latest pause checkpoint — 2026-10-01

Historical pause only: maintainer subsequently resumed with “不再暂停！直接 goal 到目标结束”. Current goal is active. Latest audit is `docs/release-audit.md`; current ContextMenu docs were regenerated and verified, and all six pinned consumer lockfiles were inspected. Continue peer/tooling correction, actual consumer-compatible package compile evidence and remaining release gates, not another pause.

Maintainer requested pausing after the next iteration because of the five-hour limit. ContextMenu lifecycle iteration is finished; pause now, not complete. See the final checkpoint in `docs/component-roadmap.md` for current implementation and exact verification evidence. 49 components remain implemented; the full target is usable reusable UI plus shared loading/font policy, mainstream coverage, consumer readiness and release audit.

Current ContextMenu preserves target/default-slot mounts when disabled changes, exposes `close()`, and uses exported `useContextMenuControl` under Reka ContextMenuRoot to gate stale opens without claiming timeout cancellation. Bilingual references, demo, README and consumer mapping were updated. Full `pnpm check`, latest tarball independent no-TypeScript compilation, key copied-source comparisons and diff whitespace checks passed. Docs were not regenerated for this iteration; previous static HTML is stale for this change. No UI/browser tests, external consumer writes, commits, pushes or publication.

Resume with docs regeneration and current ContextMenu artifact inspection, then dependency/deployment and requirement-by-requirement handoff audit. Keep manual UI acceptance, actual consumer resolved versions/migrations and candidate repository identity open. Preserve the dirty worktree; no automatic next batch until requested.

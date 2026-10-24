# Component coverage

Updated 2026-10-01. This is a release scope and implementation ledger, not a list of available exports. Planned rows are placeholders here; no fake Vue components or package exports are created.

## Evidence and boundaries

Official sources inspected: [MUI catalog and Skeleton](https://mui.com/material-ui/react-skeleton/), [Chakra Skeleton](https://chakra-ui.com/docs/components/skeleton), [Reka catalog](https://reka-ui.com/llms.txt), [Reka design principles](https://www.reka-ui.com/docs/overview/introduction), [Radix primitives](https://www.radix-ui.com/primitives/docs/components).

The useful pattern is shared primitives with explicit state, keyboard semantics and composition. Skeleton is a sized surface or a wrapper over existing geometry. It is not a global selector that replaces arbitrary descendants. Requests, fonts and routes remain the consumer's concern.

Font readiness is a separate issue: hiding text still uses fallback metrics. Preloading and metric-compatible fallbacks reduce shifts; `font-display: optional` avoids late replacement but can retain fallback on a cold visit. Neither tradeoff should be disguised as a Skeleton feature. See [web.dev's font guidance](https://web.dev/articles/optimize-cls).

### Repository sample

Source inspected on `main`. `void` and `gallery` use clean local HEADs; other repositories use GitHub snapshots. All six inspected manifests use Vue/Nuxt. This does not prove every dependency/runtime version is compatible yet.

| Repository / revision | Actual source examples | Library candidates | Keep outside library |
| --- | --- | --- | --- |
| `void` / `4921c063985389d121b7b7a160eb0e60d9b4f0de` | `app/components/CopyCommand.vue`, `SectionNav.vue`, `content/Step.vue` | CopyButton, Navigation, Sidebar | `useInstalled`, install flow, page Sheet, content/layout |
| `lig` / `e0d69dc6d5e94611b5dfce73d0761c1ec9ac89e1` | `app/components/CopyCommand.vue`, `SectionNav.vue` | CopyButton, Navigation, Sidebar | Palette/product data, install state, site layout |
| `circle` / `e491b4dc191837c41ce802072d7dbbca23da9c20` | `app/components/CopyCommand.vue`, `SectionNav.vue`, `content/Faq.vue` | CopyButton, Navigation; disclosure only if actual behavior warrants it | Template sections, install flow |
| `1000-observations` / `a73d4134927d1bdece7d96b48e18ab9b3bed9b1d` | `app/components/CopyCommand.vue`, `SectionNav.vue`, root README/package | Same template-family candidates | Product content/layout |
| `0froq.github.io` / `00d16f5462da612e23ab7061a7a77cfe8e77b791` | `app/components/ColorSchemeToggle.vue`, `TableOfContents.vue`, `SiteLikeButton.vue`, `ScrapReactInline.vue` | Button, Navigation, Sidebar, Collapsible; later Drawer, ToggleGroup, Tooltip/Popover if their interactions match | Color-scheme persistence, heading collection/scroll spy, anonymous ID, reaction API/store and data models |
| `gallery` / `6155921c8ae9c77e52c30d2bf00a7b784f53a6b8` | `app/components/WorkStage.vue`, `app/pages/index.vue`, `gallery/[slug].vue` | Button/Navigation, media loading composed with Skeleton; potential preview shell in v1.0 | ASCII art, stage/media model, morph choreography, page composition |

The maintainer confirmed `1000o = 1000-observations` on 2026-10-01. `circle` and `1000-observations` identify themselves as `paper-landing` templates in the original inventory. Repeated template files are useful duplication evidence, not independent demand votes. Later entries below are historical checkpoints; their unresolved-identity notes are superseded by this confirmation.

Primary implementation references: [personal-site components](https://github.com/0froq/0froq.github.io/tree/00d16f5462da612e23ab7061a7a77cfe8e77b791/app/components), [void components](https://github.com/0froq/void/tree/4921c063985389d121b7b7a160eb0e60d9b4f0de/app/components), [gallery WorkStage](https://github.com/0froq/gallery/blob/6155921c8ae9c77e52c30d2bf00a7b784f53a6b8/app/components/WorkStage.vue), [lig components](https://github.com/0froq/lig/tree/e0d69dc6d5e94611b5dfce73d0761c1ec9ac89e1/app/components), [circle components](https://github.com/0froq/circle/tree/e491b4dc191837c41ce802072d7dbbca23da9c20/app/components), [observations template](https://github.com/0froq/1000-observations/blob/a73d4134927d1bdece7d96b48e18ab9b3bed9b1d/README.md).

Inventory is a first-pass source sample, not a completed migration audit. No consuming repository has been modified.

The 2026-10-01 [interaction/API mapping](consumer-mapping.md) supersedes the sample for current migration decisions. In particular, circle has advanced to `741c22c22dc4227f36039883f5d0bda86962f661` and now contains a people dialog and tabs; the earlier template-only observation is historical. The detailed mapping includes inline controls, behavior-only reuse, exclusions and explicit API gaps. Representative adapter compilation and manual acceptance are still required before claiming readiness.

## v0.1: proposed baseline

14 components. Existing names retain their APIs; each must meet the release gates below. New names are proposed, not yet API-frozen. Prioritize Skeleton and CopyButton, then navigation/disclosure; do not turn every site section into a library component.

| Component | Concept | Current state | Remaining work / rationale |
| --- | --- | --- | --- |
| Button | button | Exported + demo + reference | Audit disabled/focus/native semantics; root button already receives fallthrough attributes |
| Checkbox | checkbox | Exported + demo + reference; native attrs forwarded | Manual disabled/required/form submission acceptance |
| TextInput | field | Exported + demo + reference; native attrs forwarded | Manual dynamic disabled, input events, placeholder and form acceptance |
| TextArea | field | Exported + demo + reference; native attrs forwarded | Manual native attributes and resize behavior |
| Select | select | Exported + demo + reference; native attrs forwarded | Manual disabled/name/required and empty selection; retain native select |
| Choice | radio | Exported + demo + reference; source-audited | Manual disabled item/group, arrow/Home/End, invalid model and focus acceptance; no automatic native form value |
| ChoiceCircle | radio | Exported + demo + reference; source-audited | Same disabled/keyboard contract; preserve visual variant, not duplicate behavior |
| Toggle | toggle | Exported + demo + reference; switch semantics + disabled | Manual keyboard, parent-driven model, inline measurement and reduced motion |
| Sidebar | navigation | Extracted + source-checked | Manual acceptance for folding, nested links, route adapter and moving frame |
| Paper | paper | Exported + demo + reference | Manual theme/reduced-motion acceptance; texture is not a page layout |
| Skeleton | feedback | Implemented + demo + bilingual reference | Manual whole-region surface, dimensions, hidden keyboard controls, reduced motion and theme acceptance |
| CopyButton | button | Implemented + demo + bilingual reference | Manual clipboard success/denial, keyboard, disabled and stable-width acceptance; text and translated labels are consumer-owned |
| Navigation | navigation | Implemented + demo + bilingual reference | Manual header navigation, nested-page section state, locale, external links and wrapping acceptance; no route/scroll ownership |
| Collapsible | disclosure | Implemented + demo + bilingual reference | Manual controlled open, native/custom trigger, disabled, focus return and persistent panel acceptance |

Do not force a Skeleton prop onto every primitive. Compose it around asynchronous regions; a static button or server-rendered nav has nothing to load. Known content may supply geometry, but unknown data requires an explicit layout reservation rather than guessing future row count.

### v0.1 gates

- Real implementation, root export, sibling demo, English/Chinese reference and accurate API metadata.
- Only the twelve `--ui-*` tokens; outer `.ui` supplied by caller. No router, i18n, business stores or project class/color dependencies.
- Typecheck, touched-file lint and token check pass. Whole-repository lint debt remains visible, not suppressed.
- Source review covers controlled state, native attributes, focus/disabled behavior, teardown and SSR safety.
- User checks relevant actual behaviors: both themes, keyboard, reduced motion, narrow width, loading/loaded dimensions and locale. No automated UI tests/browser checks per project instruction.
- Docs loading changes remove the global `data-fonts-loading` / `data-page-loading` descendant masks and do not blank existing SSR content during navigation.

## v1.0: mainstream basics and migration readiness

This is additional planned coverage, not a claim that v1.0 is implemented. Native HTML and plain CSS remain valid; utility/layout wrappers are not required to inflate the count.

| Family | Required basic coverage beyond v0.1 | Required behavior |
| --- | --- | --- |
| Actions / form | IconButton, ToggleGroup/segmented choice, RadioGroup-compatible Choice, FormField, NumberInput, Slider, Combobox, multi-select, FileUpload | Accessible labels/errors/descriptions, disabled/read-only/required/name, keyboard and controlled values; keep native Select distinct from searchable Combobox |
| Navigation / disclosure | Tabs, Accordion, Breadcrumb, Pagination | Link-versus-tab distinction; active/focus semantics, IDs and keyboard; no route ownership |
| Overlay | Dialog, AlertDialog, Drawer, Popover, Menu, ContextMenu, Tooltip, HoverCard/preview | Escape/outside dismissal policy, focus entry/return/trap where modal, placement/overflow, layering, nested overlays, SSR and cleanup |
| Feedback | Alert, Toast, Progress, Spinner, EmptyState | Status/error naming, determinate/indeterminate progress, announcement policy and dismissibility |
| Data display | Badge, Avatar, Separator, Card, Table, AspectRatio / media loading | Semantic HTML, fallback content and stable image geometry; table cell slots without business schema |
| Date / time | DateInput and basic DatePicker/Calendar | Locale-aware labels, keyboard, min/max/disabled dates and controlled dates; range/time extensions only when demanded |
| Shared behavior | Focus scope/return, dismissable layer, roving focus, presence, clipboard, controllable state | Reuse across components; no copies of page-specific DOM queries |

Advanced data grids, charts, rich-text editors, drag/drop canvases, full schedulers, domain-specific galleries and ASCII/rendering engines are outside basic v1.0. A plain Table does not claim sortable/virtualized grid support. Color editing may be needed for `lig`; inspect the actual palette interaction before adding ColorPicker.

Overlay behavior uses Reka UI 2.10.5 (runtime dependency), whose primitives handle focus, layers and Floating UI placement. The library owns only the token skin and deliberately smaller consumer APIs; no new CSS-token contract is introduced. Native forms and simpler state behaviors remain local primitives.

### Implemented v1.0 expansion (not the completed release)

| Component | Implementation | Manual acceptance |
| --- | --- | --- |
| Tabs | `navigation`; `useTabs`, controlled value, horizontal/vertical + RTL keys, disabled items, automatic/manual activation, persistent panels | Arrow/Home/End, manual activation, external model changes, focus leaving hidden panel, both layouts |
| Accordion | `disclosure`; composes Collapsible, single/multiple string-array model, item/group disabled | All closed, single/multiple changes, keyboard button activation and close-from-panel focus return |
| Progress | `feedback`; native progress, finite value clamping and positive maximum normalization, indeterminate state | Browser skins, accessible name, progress updates, reduced motion |
| Spinner | `feedback`; named status, fixed-size ring, reduced-motion alternative | Loading announcement, inline alignment, theme and motion preference |
| Alert | `feedback`; optional title, announcement policy, consumer-owned dismissal | Announcement timing, dismiss focus restoration, narrow content |
| Dialog | `overlay`; Reka modal, named title/description, dismissal policy, trigger/body/footer slots | Focus entry/trap/return, nesting, Escape/outside policies, overflow and portal theme |
| Popover | `overlay`; Reka non-modal anchored panel, placement/collisions, trigger/content slots | Focus/outside behavior, viewport collisions, nesting, custom portal and theme |

All seven have real root exports, demos and bilingual references. Remaining v1.0 families above are still gaps, not implied by dependency availability. No external repository was changed.

### Segmented toggle expansion

| Component | Implementation | Manual acceptance |
| --- | --- | --- |
| ToggleGroup | `toggle`; named group of pressed buttons, single string/multiple array model, typed option slot, Reka roving focus, orientation/RTL/loop and disabled items | Single clear, multiple toggle, mode changes, disabled options/group, focus-only arrows, Enter/Space, Home/End, RTL and wrapping |

It is not a Tabs panel controller or required native radio input. Display normalizes the selected value shape without changing the parent state; activation writes the appropriate shape. Keep values unique and non-empty. Native required-radio behavior stays in RadioGroup.

### Context menu and supplementary preview expansion

| Component | Implementation | Manual acceptance |
| --- | --- | --- |
| ContextMenu | `overlay`; named focusable target, context/long-press and explicit Shift+F10/Menu-key opening, recursive shared MenuItems, cancelable selection and openChange | Target/child keyboard, disabled native menu, submenu pointer travel/typeahead, outside focus, RTL and clipping |
| HoverCard | `overlay`; genuine link, delayed nonessential preview, boolean model, normalized delays, disabled preview and disposal state guard | Focus/hover delays, pointer travel/text selection, touch link navigation, disabled preview, late disposal updates and theme |

Reka ContextMenuRoot does not accept a controlled open prop, so this wrapper exposes openChange rather than a fake v-model. HoverCard content is hidden from assistive technology and cannot hold essential information or controls; preserve everything important on the link target. Its disposal guard prevents late parent model writes, not a claim that upstream timers are synchronously cleared.

### Drawer and confirmation expansion

| Component | Implementation | Manual acceptance |
| --- | --- | --- |
| Drawer | `overlay`; composes Dialog, left/right/bottom fixed-edge skin, shared title/dismissal behavior | Focus trap/return, side placement, long-content scroll, physical RTL edges, outside/Escape and custom portal |
| AlertDialog | `overlay`; actual Reka alert-dialog semantics, required title/description, safe cancel focus, cancelable confirmation and consumer-controlled pending | Initial cancel focus, outside blocking, Escape/cancel, prevented/async confirmation, disabled confirmation and focus return |

Drawer is a modal edge panel, not a swipe/gesture component. AlertDialog emits intent, not request success; callers must synchronously prevent confirmation's default before awaiting work and coordinate request cancellation if the dialog closes.

### Breadcrumb and Pagination expansion

| Component | Implementation | Manual acceptance |
| --- | --- | --- |
| Breadcrumb | `navigation`; named landmark, ordered list, route-neutral items, text/link current page and router link slot | Current identity, native modified clicks, router adapter, long labels and narrow wrapping |
| Pagination | `navigation`; native buttons or consumer-generated hrefs, one-based controlled page, normalized display, core window/gaps, typed control slot | Zero/one/many pages, disabled state, external out-of-range model, native keyboard, modified links, translated labels and router adapter |

Neither component derives routes, owns requests or moves focus to new page content. Pagination does not use tablist-style roving keys. Library rendering does not rewrite an invalid parent model; consumer owns subsequent state synchronization.

### Command menu and tooltip expansion

| Component | Implementation | Manual acceptance |
| --- | --- | --- |
| Menu | `overlay`; recursive command items, separator hints, disabled items, cancelable selection, themed submenus, Reka keyboard and focus | Arrow/typeahead/Escape, submenu pointer travel, prevented selection, RTL, modal/nonmodal, theme and custom trigger |
| Tooltip | `overlay`; plain text description over one focusable trigger, delayed pointer opening, controlled state and collision placement | Keyboard focus, hover between trigger/content, Escape, disabled behavior, trigger naming and portal scope |

These wrappers do not implement checkbox/radio menu items, router links, interactive tooltip content or shared timing across Tooltip instances. Consumer actions and trigger names remain outside the wrappers.

### Native form and display expansion

| Component | Implementation | Manual acceptance |
| --- | --- | --- |
| FormField | `field`; stable label/description/error IDs, typed control slot props, no validation engine | Label activation, required/error association, custom native control binding |
| NumberInput | `field`; native number input, optional numeric model, native min/max/step constraints | Empty/invalid drafts, decimals, arrows, required/bounds and form state reset |
| DateInput | `field`; native date-only ISO string, consumer min/max/step/native attrs | Localized display, clear/bounds, mobile date UI, no timezone conversion |
| Slider | `field`; native single-thumb range, normalized finite limits, native stepping | Arrow/Home/End, off-step external values, labels, disabled and form submission |
| FileUpload | `field`; visible native file input, change File[], explicit clear/resetKey | Select/cancel/reselect, multiple/accept hint, disabled, required and form reset |
| RadioGroup | `radio`; native fieldset/legend/input radios and form name/required association | Native keyboard, disabled options/group, native validation, external form and model reset |
| IconButton | `button`; reuses Button, named button and hidden decorative glyph | Focus/name, pressed attributes, disabled, icon dimensions |
| EmptyState | `feedback`; named section, description/content/action slots, no automatic announcement | Heading context, action focus and narrow content |
| Badge | `display`; text label with muted/accent skin, no interaction/status role | Inline alignment, theme contrast and long labels |
| Avatar | `display`; fixed-size image region composed with Skeleton and fallback | SSR cached completion, loading/error, source changes, label and consumer size overrides |
| Separator | `display`; decorative/semantic divider and orientation | Vertical parent sizing and optional accessibility semantics |
| Card | `display`; header/content/footer surface, no page/business layout | Slot spacing, borders, theme and nested controls |
| AspectRatio | `display`; positive ratio reservation and cover/contain media | Different widths, crop/contain, iframe title and overflowing slot content |
| Table | `display`; typed data/columns, stable row key function, native caption/headers, cell slots | Scroll keyboard, custom cells, empty content and stable keys on row updates |

These fourteen implementations add actual baseline coverage; they do not cover searchable selection, multi-thumb ranges, calendar date restrictions, or data-grid behavior. FileUpload cannot programmatically prefill files; native form reset must be coordinated with consumer Vue state. Choice/ChoiceCircle remain their existing animated button-radio controls rather than acquiring a fake native form guarantee.

### Meaning of “most pluggable components”

1. Before migration, enumerate actual interaction units in each repo (including inline page controls), and mark which are generic shells versus business/visual composition. Do not use total `.vue` file count as the denominator.
2. Map each generic unit to an implemented API, with its needed native attributes, slots, focus behavior and responsive variants. Record gaps and version compatibility.
3. Proposed minimum: at least 80% of those generic interaction units per repo can use the library without recreating the same generic interaction locally. Also require coverage of every high-frequency shared pattern; a low-count modal gap cannot be hidden by counting many buttons.
4. The original layouts, content, business state and visual compositions remain outside the library. Adapters may translate route/TOC data, but cannot secretly reimplement the generic control.
5. Demonstrate representative replacements locally with type/build checks and user manual acceptance before claiming readiness. Actual multi-repo migration still needs an explicit instruction.

The 80% threshold is a proposed measurable interpretation, not a user-approved reduction of scope. No coverage percentage is claimed from the first-pass sample.

## Next implementation sequence

1. Shared Skeleton + replace the rejected global masking approach; resolve font behavior separately.
2. Complete existing control reference files and native API gaps.
3. CopyButton, Navigation, Collapsible with consumer examples based on the inspected repeats.
4. Freeze v0.1 after source checks and manual feedback; then expand the v1.0 families and run the full migration mapping.

Current implementation frontier after the 49-component batch: the repository-specific source/API matrix and representative compile examples now exist in `docs/consumer-mapping.md`; continue the remaining lifecycle/deployment audit and requirement-by-requirement handoff. Searchable single/multiple selection shares Combobox; Toast/ToastRegion cover controlled temporary notifications; Calendar/DatePicker share single-month date selection. Readiness and manual acceptance are not implied by namespace or adapter compilation. Consumer repository writes are still outside this goal's current authority.

### Calendar / DatePicker batch

- `date/Calendar` adapts the installed Reka single-month behavior: controlled Gregorian ISO string/empty selection, explicit initial date and locale, six-week geometry, translated navigation labels, min/max/caller-disabled dates, readonly/disabled and direction. Initial focus prefers the enabled roving date, then navigation/root. Today marker is consumer-supplied, avoiding an implicit local-clock SSR mismatch. Other-month days are selectable unless bounded/disabled. It is not a year dropdown, range/time editor or native form input.
- `date/DatePicker` composes that same Calendar and Reka Popover, with a named date-summary trigger, separate popup model, clear/close controls and optional hidden ISO form submission. Native required/constraint validation is not claimed; use DateInput or caller validation. Consumer owns request constraints and business validation. Default portal remains the consumer's closest `.ui`.
- Framework-free `core/date.ts` validates date-only values and bounds and formats with an explicit UTC time zone, using the existing date dependency as a direct ordinary runtime range. Read-only CLI checks covered leap day, year endpoints, malformed/timestamp/year-zero values, impossible dates, inverted bounds and English/Chinese/Arabic formatting. No UI tests.
- Manual checks: arrows/Enter/Space/Tab, month boundaries, disabled/readonly/all-disabled dates, same-date selection and clearing, min/max external values, locale/RTL, popup focus/Escape/outside, hidden form payload/reset and SSR/portal theme. No range, time, swipe or automatic local-today behavior is implied.

### Toast batch

- `feedback/ToastRegion` shares a Reka provider/viewport with translated region and viewport names, default F8 shortcut, logical corner placement and existing scoped portal targeting. Caller owns queue, IDs, message removal and requests; no global notification singleton.
- `feedback/Toast` is a boolean controlled notification with title, description/default slot, foreground/background sensitivity, close label, optional ignorable action with alternative-action text, and duration override. No asynchronous success inference. Focused dismissal moves focus to the viewport. Escape handling is scoped to the focused notification, not unrelated page interactions.
- Installed Reka 2.10.5 source does not clear its close timeout on unmount, so its root duration is zero and `vue/useAutoDismiss` owns the finite timer. Timers start after mount, retain remaining time across provider pause/resume, reset on reopening or duration changes, chunk oversized delays, and cancel on close/disposal. Zero/negative/non-finite duration disables auto-close. Swipe and motion are intentionally absent from this basic skin, not implied by dependency availability.
- Manual checks: F8/Tab/Shift+Tab, Escape inside vs outside, focus after dismissal, announcement sensitivity and action alternative text, pointer/focus/window pause, reopen/dispose with pending timer, multiple notifications, translated long content, RTL corner placement and portal theme. No UI tests.

### Combobox batch

- One `select/Combobox` handles single and multiple selection, separate selected/input/open models, label filtering and consumer-filtered options. Shared Reka behavior handles keyboard/IME; scoped portals reuse the existing helper.
- Consumer owns remote search, selected-option metadata, request races, validation and loading. Input text is not free-form selection. Native required input validation does not establish that an option was selected; use native Select/RadioGroup or consumer validation for that requirement.
- Manual checks: typing and IME, arrows/Enter/Escape, single/multiple selection and clearing, no-match state, disabled options/control, form payload, remote option updates, RTL, portal theme and narrow viewport placement. No automated UI tests.

## Verification log

- 2026-09-30: added the ten missing bilingual references for Button, Checkbox, TextInput, TextArea and Select. Scoped ESLint passed. Main agent sampled TextInput, Select and Button against source; corrected Button's automatic root-attribute forwarding description.
- `pnpm typecheck` passed for library and docs; `pnpm check:tokens` passed for all 12 definitions. These checks do not prove visual or interaction acceptance.
- Roadmap/plan Markdown is ignored by the current ESLint configuration; an exit-zero invocation with ignored-file warnings is not recorded as lint coverage.
- Maintainer subsequently authorized autonomous implementation, including new concept directories. No external consuming repository has been changed.
- Wrapped native controls now share `useControlAttrs()`: styling attributes stay on the label, native attributes/events go to the control. Typecheck passed after implementation. TextInput demo exposes dynamic disabled state for manual checking; disabled skins use existing tokens without geometry changes.
- CopyButton now uses the shared unstyled `useClipboard()` behavior. It waits for actual write completion, exposes success/error events, blocks concurrent writes and clears its timer on scope disposal. Labels share a grid cell to reserve maximum width without measurement or weight changes. Source lint and typecheck passed; clipboard behavior and visual stability have not been manually accepted.
- Existing Choice/ChoiceCircle/Toggle reference formatting was fixed mechanically. Full `pnpm lint` passed after those changes. Component reference metadata now supports an optional events list, rendered by the shared API table rather than a CopyButton-specific page.
- Navigation now renders a flat wrapping link list, with route-neutral item/link types and a link slot. `useNavigation()` is shared with Sidebar for ordinary activation versus modified/default-prevented clicks. Docs SiteNav now adapts this component, retaining locale resolution, current-section matching and external-link policy outside the library. Manual navigation acceptance remains outstanding.
- Navigation batch: full `pnpm lint`, `pnpm typecheck` and `pnpm check:tokens` passed. Main agent sampled the Chinese API reference against the component and inspected the docs route adapter. No browser/UI test was performed; homepage links, current section on nested routes, locale links, external GitHub navigation, narrow wrapping and Sidebar interactions require manual checking.
- Skeleton is a shared whole-region primitive, not per-item masks. Its demo wraps the real Sidebar with a fixed layout width; known content remains mounted and inert/hidden during loading. Unknown content requires consumer-defined reservation. Loading is not inferred from fonts or route hooks.
- Removed the docs-only global loading plugin, initial loading head script and blanket descendant mask CSS. Static SSR content is available without JavaScript and cached-route navigation no longer triggers those masks.
- Docs font loading now uses all 15 existing self-hosted faces with `font-display: optional`, plus preload links for the three main Latin faces. Slow cold visits can retain fallback for that visit: this avoids late replacement rather than pretending Skeleton can fix arbitrary fallback metrics. Source/type/token checks passed; actual cold/cached refresh and cross-browser typography require user acceptance.
- Normal `pnpm generate` passed: 120 prerendered routes, including English/Chinese feedback and Skeleton routes. Generated HTML contains the real Skeleton wrapper with inert content and three font preloads, no old loading markers; generated CSS has 15 optional font faces and no swap faces. Two isolated-output verification attempts failed due to nonstandard build-path resolution and are not counted as passing builds. Existing homepage CSS parser and Cloudflare D1 warnings remain separate follow-up items.
- Collapsible and seven v1.0 expansion components are implemented. There are now 21 real component exports; source inspection confirmed an implementation, demo and both language references for every export. Sampled new English/Chinese generated routes exist.
- Choice/ChoiceCircle now skip disabled items for roving focus and selection, accept group disabling, and preserve a usable Tab entry for invalid/disabled models without changing them. Select uses native disabled options; Toggle disables its native button. Fixed radio resize-listener registration after unmount during font readiness, and stale indicators when a selected option disappears. These are source checks, not keyboard acceptance.
- Full `pnpm check` passed after the expansion; token checking now rejects undeclared stylesheet variables rather than checking definitions alone. `git diff --check` passed. Roadmap/README remain ignored by ESLint, not falsely counted as linted.
- Production `pnpm generate` passed with 160 routes. Existing homepage nested-calc parser warning and Cloudflare D1 warning persist. Normal docs dev was restarted at localhost:3000 after generation.
- `pnpm pack` succeeded into a temporary directory; inspected the tarball manifest and source list, including all component assets and ordinary resolved dependency versions. This is packaging verification only, not an npm publication.
- Independent `file:` consumer installation initially failed because `reka-ui@catalog:prod` could not resolve outside this workspace. Runtime dependencies now use ordinary version ranges; only root runtime catalog enforcement is excluded, while development-tool catalog enforcement remains. Independent installation then passed under pnpm 12 and pnpm 10.15.0; root frozen/offline install passed. No external consumer repo was modified.
- Independent pnpm 10.15.0 / Vite 8.3.1 / Vue plugin 6.0.9 consumer compilation passed with the complete public component namespace and stylesheet imported. This checks source distribution and dependency resolution without a browser, rendered UI assertions or automated interaction tests.
- Native form and display batches add fourteen components, bringing the public export count to 35. Every export has an implementation, sibling demo and both language references; main agent sampled NumberInput, FileUpload, Avatar, Table and IconButton documentation against current code. Mechanical documentation was delegated to Luna, not architecture or visual design.
- Full `pnpm check` passed for all 35 components. Independent pnpm 10.15.0 file consumer was reinstalled from the current source; its installed index was compared byte-for-byte with the current root index before a successful Vite production build (700 transformed modules). No browser, UI assertions or interaction tests were run.
- Avatar composes the shared Skeleton without per-child masks, checks cached SSR image completion and ignores stale source events. FormField exposes typed association props rather than querying child DOM. NumberInput/DateInput/Slider/FileUpload/RadioGroup retain native behavior and document native reset versus application state.
- Production `pnpm generate` passed with 78 content files and 220 prerendered routes after these batches. Checked that all 35 component pages exist with their component identities in both languages. Restarted normal docs dev after generation. Existing homepage nested-calc and Nuxt Cloudflare D1 warnings remain; no visual acceptance claim.
- Restarted dev server built client/server/Nitro successfully. It additionally reported NUXT_B7002 for unresolved transitive optimizeDeps include entries injected by the MDC module, and DevTools Vite-hook warnings. These dev warnings are recorded as follow-up, not silently counted as resolved by the successful production build.
- DropdownMenu and Tooltip now have real implementations, demos and source-matched bilingual references. Main agent sampled Tooltip Chinese metadata and both menu event/slot contracts; corrected the RTL chevron selector to use the content's actual direction attribute. Private recursive menu rendering is nested outside the public documentation scan.
- Full `pnpm check`, touched-file lint and `git diff --check` passed for the 37-component library. Independent pnpm 10.15.0 file-consumer reinstall and Vite build passed with the entire current namespace imported; consumer entry was checked against source. This is compilation/distribution evidence, not a UI acceptance result.
- `pnpm generate` passed with 82 content files and 228 routes. Both new component identities were checked in generated English/Chinese HTML; the private menu helper has no component page. Existing homepage CSS parser and Cloudflare D1 warnings persist. Manual menu/tooltip keyboard, focus, pointer travel, RTL and portal-theme acceptance remains outstanding.
- Breadcrumb and Pagination are implemented with native list/link/button semantics, typed adapter slots and bilingual references. Main agent sampled Breadcrumb Chinese metadata and Pagination English normalization/click/slot contracts against the source; documented pure non-empty URL callbacks and native disabled-button adapters. Pagination core sample output covers zero/start/middle/end, invalid values and a billion-page count without allocating the whole count. No UI tests were written or run.
- Full `pnpm check`, scoped lint and `git diff --check` passed. Independent file-consumer reinstall/build passed with the current 39-export namespace; all 39 exports have implementation/demo/English/Chinese references. Production generation passed with 86 content files and 236 routes; all 39 component page identities exist in both languages. Existing CSS parser and Cloudflare D1 warnings persist; pagination/breadcrumb interaction acceptance remains manual.
- Drawer and AlertDialog have real implementations, demos and bilingual references. Main agent sampled Drawer Chinese dismissal/placement API and AlertDialog English confirmation timing and pending policy against source/Reka implementation. Updated the ordinary Dialog example to a details panel and made the confirmation example explicitly report intent rather than claiming a request succeeded.
- The first independent build rejected imported full Dialog props because Vue's SFC compiler required consumer TypeScript for type resolution. Reverted that props extraction; Drawer declares props locally but still composes Dialog's behavior. Reinstall/build then passed in the existing independent consumer without adding TypeScript. No new consumer build requirement or fake successful result is concealed.
- Scoped source lint, root type checking, token validation and `git diff --check` passed after the correction. All 41 exports have implementation/demo/bilingual references. Production generation passed with 90 content files and 244 routes, and every component identity exists in both generated languages. Existing homepage CSS parser/D1 warnings persist. No UI tests/browser checks; edge placement, modal focus and confirmation behavior require manual acceptance.
- Final full `pnpm check` passed after the local-props correction and completed references. Normal docs dev restarted and built client/server/Nitro successfully at localhost:3000; existing DevTools hook warnings persist.
- ContextMenu and HoverCard have implementation/demo/bilingual references. Main agent sampled ContextMenu Chinese keyboard/event/portal contracts and HoverCard English model/disabled/accessibility contracts against source. DropdownMenu and ContextMenu now share private recursive MenuItems with the appropriate public primitive family, not duplicate trees.
- ContextMenu disabled changes reset the uncontrolled root and target to avoid queued long-press reopening; callers must preserve child state outside the slot. Disabled WebKit callout is explicitly restored to default. HoverCard ignores late parent model updates after disposal; upstream delay timers are not claimed to be synchronously cleared.
- Full `pnpm check`, independent file-consumer reinstall/Vite build and `git diff --check` passed for 43 exports. Every export has implementation/demo/bilingual reference. Production generation passed with 94 content files and 252 routes; all 43 component identities exist in both generated languages, and private helpers have no public component route. Existing homepage CSS parser and D1 warnings persist. No automated UI/browser validation; menu keyboard/disabled target remount, long press, preview timing/pointer travel and theme remain manual checks.
- Normal dev restart built client/server/Nitro, then reported an unhandled `NoResponse: No response from target` with a masked `webkit` stack rather than an application source path. The process still listens on port 3000; cause is not established and this is not treated as resolved or as proof of UI failure. No browser was operated.
- ToggleGroup has a real segmented-button implementation, demo and bilingual API reference. Main agent sampled Chinese metadata, model projection, keyboard and attrs contracts against implementation/Reka source. Narrow string and array model examples are compiled in the demo. Initial generic default/getter typing attempts failed; corrected the default factory and explicit display-value type before the final passing checks.
- Full `pnpm check`, independent consumer reinstall/build and `git diff --check` passed. All 44 exports have implementation/demo/bilingual reference. Production generation passed with 96 content files and 256 routes, and all 44 component identities exist in generated English/Chinese HTML. Existing homepage CSS parser/D1 warnings persist. No UI tests; single deselection/multiple values, mode changes, keyboard/RTL/loop, disabled states, label slots and wrapping require manual checking.

- Combobox brings the namespace to 45 real components. Main agent sampled both Luna-produced references against source, corrected the form payload/lifecycle and readonly boundaries, and verified the implementation/demo/reference set. Full `pnpm check`, independent file-consumer reinstall/Vite compilation, final docs configuration lint/typecheck and `git diff --check` passed. Generation processed 98 content files and 260 routes; all 90 bilingual component identities were checked in static HTML.
- Source-package compilation is not manual UI acceptance. Combobox typing/IME, keyboard selection, multiple deselection, disabled state, clearing, remote data, indexed form fields and portal placement still require manual checking. The existing homepage CSS parser/D1 warnings persist.
- Found that dev startup emptied the shared production `dist`; moved custom Nitro output paths into Nuxt `$production`. Regeneration passed, then dev reached client/server/Nitro ready and the generated bilingual Combobox pages remained present. No browser/UI test was run.

- Toast/ToastRegion bring the namespace to 47 components. Main agent sampled Luna's English and Chinese API/lifecycle descriptions against source and corrected action-ordering, SSR and demo-result wording. Full `pnpm check`, independent consumer reinstall/Vite compilation and `git diff --check` passed; copied Toast/timer sources match the current library. Generation passed with 102 content files and 268 routes, and all 94 bilingual component identities were checked. Latest Chinese examples were verified after regeneration rather than relying on an earlier stale build. Existing homepage parser/D1 warnings remain. No UI tests/browser checks; notification announcements, focus, pause timing and placement remain manual acceptance items.

- Calendar/DatePicker bring the namespace to 49 components. Main agent sampled both Luna references against source and added the view-anchor event, persistent empty picker view and clear-focus/reset boundaries. Full `pnpm check`, independent source-consumer reinstall/build and `git diff --check` passed; date source copies match the current library. Generation passed with 106 content files and 280 routes. All 98 bilingual component identities were checked; the calendar artifact has 42 native day buttons, the caller's today marker, non-tabbable outside-month days and the grid role. These are static/source checks, not gesture or assistive-technology acceptance. Keyboard, disabled-date behavior, locale/RTL, popup focus and form/reset remain manual checks.

### Requested pause checkpoint — 2026-09-30

The maintainer requested pausing after this iteration because of the five-hour usage limit. Calendar/DatePicker is the final completed batch before that pause; do not start another batch automatically. The full goal remains a usable UI library with shared loading/font policy, baseline and mainstream coverage, six-repository migration readiness and a release audit. It is not complete merely because 49 exports compile.

Resume at repository-specific interaction mapping (`0froq.github.io`, `void`, `gallery`, `lig`, `circle`, candidate `1000-observations`), then audit the actual requirements against current source/distribution/docs and prepare the handoff. Existing homepage CSS parser, deployment D1/peer warnings and manual behavior acceptance remain explicitly open. Other repositories are read-only; no UI tests/browser automation, commits or pushes have been authorized. Preserve the dirty worktree. Source-of-truth plan: `docs/plans/2026-09-30-ui-coverage.md`.

### Distribution audit and requested pause — 2026-10-01

After resumption, the maintainer again requested pausing at the next iteration boundary because of the five-hour limit. This bounded iteration audited the actual packed artifact, not another component batch.

- `pnpm pack --pack-destination /tmp/froq-ui-release-audit-DepMK1` succeeded. Artifact: `/tmp/froq-ui-release-audit-DepMK1/froq-ui-0.1.0.tgz`; SHA-256 `f6b36fc9fb0904efbcbca34ce19781b6936e33713ef5b2f57ba33a5d89c8b682`.
- Extracted archive: all 235 `src` files match current workspace bytes; all 49 root components have implementation/demo/English/Chinese reference files; all five package entry points and direct stylesheet imports resolve. Runtime dependencies use ordinary version ranges, not workspace/catalog/file/link protocols.
- Independent temporary fixture `/tmp/froq-ui-consumer-gjpvsv` now installs this tarball (rather than the previous directory dependency). `pnpm add <artifact> --ignore-scripts` and `pnpm exec vite build` passed with Vite 8.3.1, Vue 3.5.43 and no direct TypeScript dependency. This compiles the full component namespace; its bundle size is not an individual-component cost. No UI was rendered or tested.
- `git diff --check` passed. This iteration did not change component code, regenerate docs, re-run full lint/types, change external repositories, commit, push or publish. Earlier source/generation results remain historical evidence, not new results.

Pause now; the goal is not complete. Resume with six-repository interaction/API mapping, then the remaining source/API/deployment audit and final handoff. Inspect the deferred Combobox clear-focus behavior, ToggleGroup model typing and ContextMenu disabled-slot remount contract against current source. Keep homepage parser/D1/peer warnings and user manual acceptance open. Preserve the dirty worktree and read-only consumer boundary; do not restart component expansion merely to increase the count.

### Resumed migration/API audit — 2026-10-01

Maintainer resumed the goal and explicitly revoked further pausing. Earlier pause checkpoints above are historical, not the current status. Goal remains active and incomplete.

- Refreshed the four remote revisions and read the two local source trees without modifying consumers. `circle` now has actual people/card/tab interactions, replacing the old template-only assumption. `docs/consumer-mapping.md` maps shared and inline controls to current props, models, slots and behavior exports, with domain exclusions, supported version ranges and explicit limitations. No invented coverage percentage; candidate `1000o` identity remains unconfirmed.
- Added Dialog/Drawer `showTrigger` (default true) and optional `returnFocus` for external/many-origin controlled modals. Shared unstyled `vue/useFocusReturn` binds cancelable autofocus events without replacing Reka's trap/layer. Current valid explicit target wins; external mode falls back to the captured opener, never guesses a page fallback. Default trigger mode falls back to Reka when an explicit target is unusable. Consumers can synchronously prevent closeAutoFocus to choose a fallback; rapid reopening does not send an old close event's focus outside the new layer.
- One mechanical Luna task updated four Dialog/Drawer reference files. Main agent inspected Dialog English and Drawer Chinese metadata/lifecycle sections against source, corrected the built-in versus external fallback boundary, and checked events/SSR/disabled descriptions. No agent exit status was used as sole acceptance.
- `docs/examples/ConsumerAdapters.vue` composes landing Navigation/CopyButton, custom lig-style useChoice/useClipboard and many-origin Dialog/Drawer/Tabs. Standalone strict vue-tsc and docs-scoped ESLint passed. The root ESLint ignores docs, so its initial ignored-file warning is not counted as example lint coverage.
- Combobox clear now focuses its native input before the clearing button disables itself. ToggleGroup/Combobox single-value model types include the empty string; multiple models retain arrays. Demos compile narrow literal models including their clear state. Option-data compatibility and switching single/multiple shapes remain consumer-owned; this is not remote-data validation.
- Homepage title formula is split through a local custom property without changing its arithmetic. Full latest generation output no longer includes the previous nested-calc parser warning. Actual title layout remains a manual check.
- Final `pnpm check`, `git diff --check`, scoped reference/source lint, standalone example types and independent no-TypeScript Vite compilation passed. Generation processed 106 content files and 280 routes; all 49 implementation/demo/EN/ZH sets and 98 bilingual component identities were checked, including updated autofocus and Combobox descriptions. Dev restarted at localhost:3000 and reached client/server/Nitro ready; generated artifacts remained present. These are not UI/browser/manual acceptance.
- Latest packed artifact `/tmp/froq-ui-final-pack-ejJnZ8/froq-ui-0.1.0.tgz`, SHA-256 `fdb7826e0331739751e33ebbd2ab2e373ec4eac4d341ce70b071710fed3290dc`. Independent `/tmp/froq-ui-consumer-gjpvsv` now uses this tarball and compiles the whole namespace plus an identical adapter source copy. All 236 packaged `src` files match workspace bytes. Earlier tarball hashes/results remain historical; refresh after any later source change. No publication, commits, pushes or consumer writes.

Next: audit ContextMenu disabled-slot remount/scroll-dismiss limits and remaining source/API/distribution/deployment requirements, then prepare the final evidence-bounded handoff. Cloudflare D1, Nuxt/h3/DevTools and peer warnings remain visible; resolved dependency compatibility across the actual consumers is not proven by manifest ranges alone. Manual checklist for this batch: default/external/modal nested focus entry/return, missing/disabled opener and cancelable focus override, rapid reopen, Drawer events, narrow single/multiple selection and clearing, Combobox keyboard/pointer clear, homepage font/geometry, theme/RTL/narrow viewport. Preserve the no-UI-test/browser and read-only consumer boundaries.

### ContextMenu lifecycle iteration and requested pause — 2026-10-01

The maintainer explicitly requested pausing at the next iteration boundary because of the five-hour limit. This checkpoint supersedes the earlier active/no-pause instruction. Goal is paused after this bounded ContextMenu iteration, not complete.

- Goal remains a usable reusable UI library: shared whole-region Skeleton/font policy, baseline/mainstream control coverage, six-repository interaction/API mapping and migration readiness, and an evidence-bounded distribution/deployment handoff. 49 components is an inventory count, not completion evidence.
- ContextMenu no longer keys/remounts its uncontrolled root when disabled changes. Target/default-slot child state survives; disabling closes the menu. New public component-ref `close(): void` closes/rejects pending opening; caller owns scroll/route dismissal policy. No controlled open prop/model or global listener was added.
- Shared unstyled `useContextMenuControl` uses Reka's exported root injection API beneath ContextMenuRoot, with a private renderless ContextMenuState wrapper. Synchronous boolean guard rejects stale open requests before content rendering. Capture preparation waits through the event's default-prevention phase and checks a close revision; re-enabling alone cannot revive a queued long press. A fresh accepted contextmenu/touch/pen gesture re-arms. It does not cancel Reka's internal timeout.
- Demo has disabled and close controls plus a locally stateful Collapsible to make state preservation manually inspectable. One existing Luna agent updated only the bilingual references; root inspected both against source, removed duplicate state paragraphs and checked ref usage. README and consumer mapping now describe explicit close instead of the former scroll-close API gap.
- Final `pnpm check` and `git diff --check` passed. Current tarball `/tmp/froq-ui-contextmenu-pack-KKgCRf/froq-ui-0.1.0.tgz`, SHA-256 `f19df9a82f981f98fba1689e02e8e59c60b5ce25299f9400416b77268c70bb1b`. Independent no-direct-TypeScript fixture `/tmp/froq-ui-consumer-gjpvsv` installs this artifact and compiles the full namespace plus existing adapters; ContextMenu, private wrapper and helper copies match current source.
- Docs generation was NOT repeated this iteration. Previous 106-file/280-route/98-bilingual-identity results remain historical; generated HTML is stale for this ContextMenu update. No browser/UI testing, consumer writes, commit, push or publication occurred. D1 deployment warning persists.

Resume: regenerate current docs and inspect current ContextMenu bilingual/reference/private-helper artifacts, then continue remaining dependency/deployment and requirement-by-requirement release audit. Six consumer resolved versions and actual migrations are not established by manifest ranges. Candidate 1000o identity and manual acceptance remain open. Do not expand components simply to increase count.
Manual checks for this iteration: child state across disabled toggles; right-click and ContextMenu/Shift+F10; touch/pen long press followed by disable/reenable or close before timeout; prevented gestures and close within a gesture; selection/Escape/outside dismissal and focus return; consumer-owned scroll-close; nested submenu, theme/RTL/narrow viewport.
Preserve the dirty worktree and read-only consumer boundary. Do not resume automatically until the maintainer asks.

### Active release audit after resumption — 2026-10-01

Maintainer explicitly resumed with “不再暂停！直接 goal 到目标结束”. Goal is active; prior pause checkpoints are historical. This turn made concrete source/distribution/audit progress, not a verified wait or status-only turn.

- Regenerated docs from current ContextMenu source: 106 content files/280 routes, exit 0. Checked every 49 sibling implementation/demo/EN/ZH set and all 98 bilingual generated identities, current ContextMenu exposed methods/demo text, and absence of private helper routes.
- Added `docs/release-audit.md` with requirement-by-requirement evidence, manual gates and deployment/dependency limits. Official Nuxt Content static hosting uses browser WASM SQLite; its server Cloudflare Pages preset requires D1. Current `dist` has SQL dumps/SQLite assets and no Pages worker. No database provision, server architecture change or remote deployment acceptance claimed from the warning.
- A mechanical inventory agent inspected six pinned root lockfiles; root sampled original personal/void/circle importers, including personal Vue 3.5.41. All locked Nuxt versions are 4.5.2; other Vue versions are 3.5.43. Updated consumer mapping with exact root-importer lines. Candidate 1000o identity remains an unanswered non-blocking clarification.
- CI install now freezes the committed lockfile. Current frozen install passes. Corrected Antfu/Unicorn's verified ESLint peer mismatch by changing only ESLint catalog to ^10.9.1 (resolved 10.11.0). Full source/docs lint/types/token checks pass. Remaining cac/oxc-parser/unplugin transitive peers are explicitly recorded, not hidden by global overrides.
- Independent packed-library fixture switched to the personal site's Vue 3.5.41; install/full namespace/adapter Vite compile passed without direct TypeScript dependency. Does not prove a real Nuxt consumer migration. Current README differs from the prior tarball; refresh package before final handoff rather than reuse its hash as current-byte evidence.
- A newly started dev reached client/server/Nitro ready on 3002 because another same-workspace process occupied 3000; stopped only the new instance, retained existing 3000. Generated pages survive dev startup. Added module optimizeDeps warning remains open alongside DevTools/Nuxt/h3 warnings. No UI/browser tests, external repo writes, commits, pushes or publication.

Continue: independent Nuxt consumption against current package, transitive dependency warning/source audit, final current-package verification and requirement-by-requirement handoff. Manual behavior acceptance is not proven and cannot be inferred from static compilation; no completion claim yet.

### Independent Nuxt consumption — 2026-10-01

This active goal iteration completed the pending independent Nuxt compile gate. Current tarball `/tmp/froq-ui-nuxt-pack-ZLx3vE/froq-ui-0.1.0.tgz` SHA-256 `0de096e685c88a5061a93d5c9610e8af75cddd534a675fa969b953a5f2c50d6f` is installed in temporary `/tmp/froq-ui-nuxt-consumer-xeck46`. Nuxt 4.5.2/Vue 3.5.41 compiled root/core/vue namespace imports and CSS in client and server builds using documented transpile settings, no workspace alias and no direct TypeScript dependency. Install/build/frozen install passed. All 238 packaged src files and README compare equal to current workspace; five export paths resolve and runtime dependency ranges are portable.

The fixture intentionally does not mount/render library UI; it is package compilation, not UI testing or an external consumer migration. Nuxt's fresh fixture does not include the Content/ESLint modules responsible for recorded docs-only peer warnings. No root component code or runtime range changed this iteration. Audit/mapping updated; goal remains active, with actual manual acceptance and candidate repo identity unproven. Continue remaining source/API gates and evidence-bounded final handoff; don't rerun identical compilation merely to manufacture progress.

### Native control API and clipboard delay audit — 2026-10-01

Reviewed nine native form/control implementations plus useControlAttrs and references. Native attr routing, single-value Select, optional numeric model, file reset events, fieldset-radio form association and single-control FormField boundaries match documented source contracts; actual form/keyboard behavior is not manually accepted.

Corrected a verified useClipboard overflow issue: resetAfter accepts positive finite delays, but native timer delays above 2,147,483,647 ms overflow. Reset now uses bounded timer chunks with monotonic elapsed subtraction and existing next-copy/disposal cancellation. Bilingual CopyButton docs clarify capture-at-result timing and background throttling. No new props, skins, lifecycle mount dependency, export or runtime package. Full check result and refreshed artifacts must be recorded after this code change; the prior Nuxt tarball is no longer current-source evidence. Goal remains active. No UI/browser tests or external consumer mutation.

Final source check for this iteration passed. Refreshed actual package `/tmp/froq-ui-clipboard-pack-7d9S5i/froq-ui-0.1.0.tgz` SHA-256 `3659724e1964d088a27f73d8cd83a28bb37dbc6169dbe0fc3bb011021aafdc75` installed in independent Nuxt fixture; client/SSR compilation passed and changed helper/EN/ZH source copies match. Static docs were not regenerated this iteration and remain stale for the new timing paragraphs. Next: update current docs evidence, finish remaining requirement/handoff gates; actual timer/clipboard behaviors remain for user manual checking. No further component-count expansion.

### Finite handoff / outstanding external gates — 2026-10-01

Refreshed current docs after the clipboard correction: generation passes (106 files/280 routes), all 49 sibling component sets and 98 generated identities inspected, both timer paragraphs current, no private-helper routes. Added `docs/handoff.md` with delivered architecture, local start/consumer instructions, evidence limitations and eight finite manual acceptance categories. Scope remains unchanged; no new component or dependency.

Implementation/distribution handoff is ready. Per the release gates already recorded, full completion still lacks actual manual UI acceptance (automated UI/browser checking is forbidden by AGENTS) and confirmation that candidate 1000-observations is the requested 1000o. Those require maintainer evidence/choice; no other implementation task is invented to defer that boundary. First explicit impasse report after finishing available in-scope work: keep goal active pending response, do not pause or mark complete. If the same impasse persists for three consecutive goal turns with no meaningful safe work available, follow the goal blocked-status rule rather than endlessly re-running builds. No consumer migration, publication, commit or push authorized.

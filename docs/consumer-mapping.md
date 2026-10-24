# Consumer interaction mapping

Source audit: 2026-10-01. This maps actual interactions to current library APIs, not component filenames to similarly named exports. No consuming repository was changed. Source compatibility is not visual, keyboard or deployment acceptance.

## Evidence and scope

| Repository | Inspected revision | Source |
| --- | --- | --- |
| void | `4921c063985389d121b7b7a160eb0e60d9b4f0de` | Read-only local `/Users/oQ/2_areas/development/web-apps/void` |
| gallery | `6155921c8ae9c77e52c30d2bf00a7b784f53a6b8` | Read-only local `/Users/oQ/2_areas/development/web-apps/gallery` |
| personal site | `00d16f5462da612e23ab7061a7a77cfe8e77b791` | [Pinned source](https://github.com/0froq/0froq.github.io/tree/00d16f5462da612e23ab7061a7a77cfe8e77b791/app) |
| lig | `e0d69dc6d5e94611b5dfce73d0761c1ec9ac89e1` | [Pinned source](https://github.com/0froq/lig/tree/e0d69dc6d5e94611b5dfce73d0761c1ec9ac89e1/app) |
| circle | `741c22c22dc4227f36039883f5d0bda86962f661` | [Pinned source](https://github.com/0froq/circle/tree/741c22c22dc4227f36039883f5d0bda86962f661/app) |
| observations candidate | `a73d4134927d1bdece7d96b48e18ab9b3bed9b1d` | [Pinned source](https://github.com/0froq/1000-observations/tree/a73d4134927d1bdece7d96b48e18ab9b3bed9b1d/app) |

Remote commit identities were refreshed through GitHub's commits API. `circle` has changed since the first inventory: it now includes a people board, person dialog and tabs. Do not reuse the old template-only assessment. On 2026-10-01 the maintainer confirmed `1000o` means `0froq/1000-observations`. The previously audited candidate is therefore the intended repository; this confirmation does not imply manual design acceptance of library components.

Inspected interaction markers across app Vue/TypeScript sources: native controls, summaries, click/keyboard/pointer/focus handlers and explicit interaction roles. Read implementations and callers for the rows below, including inline page controls and exported library behavior. Ordinary content links, text, decorative SVG, routes and layouts are not separate reusable controls. Repeated rows inside a group count as one interaction pattern, not many votes. The initial 80% target remains a proposal, not an approved denominator or a measured result.

Remote archives for lig/circle/observations are available under `/tmp/froq-ui-mapping-mDywrn`. The personal-site archive was intentionally interrupted while downloading a large font asset; it is incomplete and must not be used as a complete snapshot. Its app interaction census and selected implementations were fetched directly from the pinned raw sources instead.

## Shared landing-site family

These rows apply to void, lig, circle and the observations candidate. The template repeats do not represent four independent design requirements.

| Actual unit / source | Current API | Consumer adapter and boundary |
| --- | --- | --- |
| `components/CopyCommand.vue`, used by `content/Step.vue` | `CopyButton`: text, label, copiedLabel, errorLabel; copy/error events | Keep the code block and translated labels outside. Add an actual error label: existing optional clipboard calls can report success when the API is absent. Library waits for the write result and cleans up timers. |
| `components/SectionNav.vue`, `SiteHeader.vue` | `Navigation`: items `{value,label,href}`, model, `current="location"`, aria-label | Map section id to value and `#id`; keep heading collection, scroll spy, pinned placement and scroll offsets in `usePageSections`. This is flat navigation, not a mandatory Sidebar. |
| `SiteHeader.vue`, `SiteFooter.vue` route/locale link groups | `Navigation` link slot + NuxtLink | Consumer owns locale paths, external-link policy and section matching. Keep isolated brand/skip/content links as anchors; do not replace them with buttons. |
| `content/Faq.vue` | Native details remains valid; optionally `Collapsible` or `Accordion multiple` | FAQ text/Fill/RichText remain content slots. Rich trigger content can use Collapsible's trigger props. Controlled model is required when migrating local details state; do not add loading to server-rendered FAQ. |
| `Installed.vue` back action; action branch of `InstallLink.vue` | `Button`: native type/disabled/click/ref attrs | Keep `useInstalled`, success text and transition/focus scheduling in the project. The URL branch remains NuxtLink; the no-URL action should be a button rather than `href="#"`. A Button component ref is not a native element ref: retain a native ref via a consumer wrapper/DOM binding instead of assuming `.focus()` on the component. |
| `SiteFooter.vue` theme cycle | `Button` with translated next-theme label | Theme persistence, client readiness and next-state computation stay in `useTheme`; no fake boolean Toggle for a cycle. |

## lig-specific units

| Actual unit / source | Current API | Boundary / limitation |
| --- | --- | --- |
| Copy-format group in `palette/PaletteShowcase.vue` | `RadioGroup` for non-clearable selection; or `ToggleGroup` if clearing is intentionally allowed | Options hex/rgb/hsl/css, translated label, consumer format model. Existing format is always selected; ToggleGroup can clear, so it is not behavior-equivalent without a guarded consumer model. |
| `PaletteSwatch.vue`, `PaletteSyntax.vue`, `PaletteSemanticTable.vue` copy controls | `useClipboard(() => formattedValue)` from `@froq/ui/vue` + Button, or CopyButton when using its standard text skin | Palette colors, role metadata, hex/rgb/hsl/css conversion and swatch rendering stay in the project. Use one behavior per independently copied item, not a global success boolean. Custom swatch skin is not falsely counted as a direct CopyButton skin replacement. |
| `PaletteShowcase.vue` more-colors details | `Collapsible` | Label and palette content remain consumer-owned. Native details may also remain; no new palette-specific disclosure implementation is needed. |
| `palette/choice/Circle.vue` and `Stop.vue` single-choice groups | `ChoiceCircle`/`Choice` for standard skin, or `useChoice(options, variant)` for custom skin | Translate `{id,label}` to `{value,label}`. Existing circles/line-travel are visual compositions. Preserve roles, disabled state, roving tabindex and keyboard by binding the shared behavior; do not copy the existing `radioKey` helper. |
| `palette/choice/Matrix.vue` two-axis radio layout | `useChoice` + consumer native radio buttons | Keep join/splitVariant and hover readout outside. Current behavior is linear arrow traversal, not a spatial two-dimensional grid contract. Do not claim that RadioGroup's standard layout preserves the matrix art direction. |
| `palette/choice/Wildmenu.vue` radio selection plus terminal typing | `useChoice` | Consumer owns delayed typed text, target variant and reduced-motion timing. Bind the shared behavior to the target ref; final applied variant is intentionally delayed. A Combobox is not the same interaction. |
| `palette/choice/Sentence.vue` two inline switches | `Toggle` with two computed boolean adapters | Consumer maps light/dark and crisp/soft back to the variant. Keep sentence fragments/translations outside. Library label reservation differs from the existing measured width; manual layout review is required. |
| `PaletteDownloads.vue` repository links and generated-file paths | Native links and code | Not a FileUpload, downloader engine or ColorPicker. No editable color input was found in these interactions; do not add ColorPicker from the repository name alone. |

## circle-specific units

| Actual unit / source | Current API | Boundary / limitation |
| --- | --- | --- |
| `circle/CirclePersonCard.vue` modal shell, called from `CirclePage.vue` | Dialog with `showTrigger=false`, model and `returnFocus` | Person selection comes from many board buttons. Pass the actual opener DOM element; no unrelated trigger or whole-board pretend trigger is needed. Person data, wheel-close policy, timeline/posts and selected-person model stay outside. The representative modal/tab adapter compiles; actual focus/keyboard acceptance remains manual. |
| Person-card mine/theirs tab group | `Tabs`: items, label, model, disabled second item, content slot | Reset model on person change in the project. Shared Tabs supplies roving keys and panel identities missing from the current click-only tabs. Person content stays in the slot; names need translations. |
| `CircleAccessibleList.vue` details | `Collapsible` | Keep list data, two-column responsive content and accessible title outside. |
| `CircleBoard.vue` person activation and image readiness | Native/custom Button shell, Avatar or Skeleton composed where appropriate | Packing/radii, hover scaling, board geometry and hover label are domain/art direction, not a new AvatarGrid component. Current readiness scans descendant images: adding Avatar would change that DOM/lifecycle contract, so readiness must be consumer-owned and explicit before replacement. Whole-board Skeleton is possible with reserved square geometry; not a mask on every person. |

## gallery units

| Actual unit / source | Current API | Boundary / limitation |
| --- | --- | --- |
| `layouts/default.vue`, `pages/gallery/[slug].vue` theme buttons | `Button` | Both are one repeated theme-cycle pattern. Keep useTheme/client readiness. |
| Header/footer index links, next-work navigation, locale links | `Navigation` for groups; native/NuxtLink for isolated back/next links | No Pagination: this is next-work navigation, not page numbers. Caller owns localePath, next record and modified-link behavior. |
| `pages/index.vue` catalog hover/focus preview | Existing native links; HoverCard only if intentionally changing to anchored per-item previews | The current shared morph figure tracks row offset and is aria-hidden. It is project choreography, not a modal. HoverCard preserves a genuine link and nonessential preview but does not preserve this shared-stage animation; not counted as a drop-in replacement. |
| `WorkStage.vue` image/video regions | Optional `AspectRatio` + Skeleton composition | Media metadata/readiness and autoplay/muted/loop/playsinline stay outside. Existing data has no explicit media aspect ratio, so caller must supply a stable reservation before claiming no layout shift. Do not infer image readiness from component mount. |
| `AsciiField.vue`, kit paper/grain choreography | Excluded domain renderer | Not library feedback, Calendar, Drawer or data display. Keep renderer, layout and pointer choreography outside. |

## Personal-site units

| Actual unit / source | Current API | Boundary / limitation |
| --- | --- | --- |
| `AppNav.vue`, `publication/RoomSwitch.vue`, header/footer route groups | `Navigation` + NuxtLink slot | Route ownership, publication models, active section, history and viewport layout remain outside. |
| `ColorSchemeToggle.vue` auto/light/dark cycle | `Button` | Consumer retains useColorScheme/persistence/icons and current accessible name. Not a boolean switch. |
| `AppHeader.vue` CV language buttons and print | `RadioGroup` (en/zh) or Button with aria-pressed; Button for print | Router query update and window.print remain consumer actions. Do not reinterpret languages as tabs without associated panels. |
| `DeskNote.vue` local scratch textarea | `TextArea`: label, model, rows, placeholder, blur | Keep localStorage hydration/persist outside; native blur attrs forward to textarea. Keep visual stationery layout outside. |
| `InkFold.vue`, called by `HomeScrapFold.vue` | `Collapsible` trigger/default slots | Bind generated trigger props to a native button and keep ink decoration in its slot. Library keeps panels mounted hidden/inert; existing version unmounts after animation. Mount-sensitive streams/content need explicit consumer policy; not a silent identical lifecycle claim. |
| `SiteLikeButton.vue`, `ScrapReactInline.vue` | Button with disabled/name/aria-pressed attrs and content slot | API, anonymous ID, busy state, counts, optimistic/server state and reaction intent stay outside. Do not use uncontrolled ToggleGroup to infer successful reactions. |
| `pages/contact.vue` copy-handle controls | CopyButton or useClipboard + custom Button | Text/ink glyphs/layout remain consumer-owned. Real copy outcome and teardown can be shared without copying timer logic. |
| `HomeScrapFold.vue` right-click reaction popup | `ContextMenu`: translated label, items `{value,label}`, select/openChange, item slot, exposed `close()` | Map item values to emoji and emit consumer reaction. Single command items close on selection, fitting current policy. Existing popup uses ordinary buttons inside a menu role without menu navigation. Consumer scroll/route policy can call `close()` through a component ref; target content remains mounted. Open state is still internal, not a fake v-model. |
| `TableOfContents.vue` nested headings | `Sidebar`: groups/items, location model and anchor hrefs | Caller collects heading hierarchy, observes visibility and adapts scroll actions. Keep route/DOM selectors, heading elements and marquee outside. Library should not collect headings. |
| `TableOfContents.vue` compact overlay; `IssuePeekFloat.vue` mobile preview | Drawer/Dialog with `showTrigger=false`, model and `returnFocus` | Consumer owns breakpoint, selected entry, scroll-dismiss and actual opener. The representative external Drawer compiles without an extra trigger. Inline desktop preview remains desktop composition. |
| `IssueList.vue`, `publication/EntryLink.vue` preview activation | Button/native NuxtLink plus consumer selected-entry adapter | Interactive IssuePeekCard has links/like actions: do not replace it with aria-hidden HoverCard or plain-text Tooltip. Use a modal/nonmodal interactive shell as appropriate. Shared desktop side preview is not necessarily a popover. |
| `SiteDoing.vue` clickable phrase; `SiteHub.vue` layer-cycle; `SiteChromeNav.vue` action branch | Button | Activity requests, phrase generation/layers/history stay outside. Existing role=button phrases only handle Enter; native Button supplies Space as well. URL branch remains a genuine link. |
| `DeskPin.vue`, JournalHeat, JournalMonthFolder, ink cursor/select/motion plugins | Excluded domain choreography; native actions can use Button | Pin pointer gestures, journal heatmap/stack/month data and page transitions are not a general data grid or date selection. Calendar is not a replacement for a journal visualization. |

## Consumption contract and remaining proof

All six manifests/catalogs declare Nuxt 4.5.2-compatible ranges. The five landing/gallery catalogs declare Vue ^3.5.43; personal site declares ^3.5.39. Pinned lockfiles now verify actual root-importer resolution, not just ranges:

| Consumer at the revision above | Locked Nuxt | Locked Vue | Lockfile root importer lines |
| --- | --- | --- | --- |
| void | 4.5.2 | 3.5.43 | 78–83 |
| gallery | 4.5.2 | 3.5.43 | 90–95 |
| personal site | 4.5.2 | 3.5.41 | 140–142 and 158–160 |
| lig | 4.5.2 | 3.5.43 | 79–84 |
| circle | 4.5.2 | 3.5.43 | 78–83 |
| observations candidate | 4.5.2 | 3.5.43 | 75–80 |

All satisfy the library's ^3.5.0 peer range. A mechanical agent inspected all six catalogs/importers; root independently sampled void, pinned personal site and pinned circle importer values, including the older personal-site Vue. This proves source lockfile resolution, not installed consumers or deployment compatibility. Candidate identity is still unconfirmed. Nuxt needs source transpilation for `@froq/ui`; consumers supply `@froq/ui/style.css`, outer `.ui`, all twelve theme variables, and fonts. Keep existing site fonts unless intentionally adopting the library typography; geometry must be reviewed after token mapping.

Route adapter reference exists in this repository at `docs/app/components/SiteNav.vue`. It owns i18n/current-section matching and removes generic link onClick when handing routing to NuxtLink. A route callback must not cancel native modified navigation accidentally. Skeleton uses explicit consumer loading and reserved geometry; no automatic route/font mask.

This source/API matrix is complete enough to drive concrete replacement work, but migration readiness is **not yet proven**. Next evidence required:

1. External/many-trigger modal API is implemented in Dialog/Drawer. Default built-in-trigger behavior remains; consumers can hide it, supply a return target, or synchronously prevent closeAutoFocus to choose a fallback. No replacement focus trap/layer was copied into consumers. Manual focus behavior remains unaccepted.
2. `docs/examples/ConsumerAdapters.vue` covers landing Navigation/CopyButton, lig custom useChoice/useClipboard, and circle/person-site external Dialog/Drawer/Tabs. Strict standalone vue-tsc and docs-scoped ESLint passed; the independent no-TypeScript fixture compiled a copy with the full namespace. These are compile examples, not migrated external projects or rendered UI tests. Refresh fixture source copies after subsequent changes before reusing the result.
3. Review native attributes, supported child/ref contracts, controlled models and remaining release issues against those examples; inspect package/deployment warnings rather than hiding them.
   Current separate Nuxt 4.5.2/Vue 3.5.41 fixture installs the latest tarball and compiles root/core/vue namespaces in both client and SSR builds with the documented transpile/style settings. No workspace alias/direct TypeScript dependency or UI mounting is used. This supplies external Nuxt package-compile evidence, not a real consumer migration or manual behavior acceptance; exact artifact/commands are in `release-audit.md`.
4. User manual checks: route/locale/modified clicks, copy denial and width stability, focus entry/return, nested/disabled controls, persistence, theme/narrow layouts, reduced motion and region loading dimensions. No UI tests/browser automation. No percentage or completed-release claim before these gates are evidenced.

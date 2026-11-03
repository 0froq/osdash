# Document Layout Implementation Plan

**Goal:** Use the same document layout and prose styles across guides, component catalogs, component details, release notes and standalone content pages.

**Architecture:** DocPage owns reading width and composes PageHead and DocBody. PageHead supports compact article headings alongside the existing poster and section heads. DocSection reuses the article heading for repeated entries and detail sections. DocBody owns prose and API table styles. Interactive demos stay outside DocBody so prose selectors cannot style their controls.

**Tech Stack:** Nuxt, Vue SFCs, TypeScript, Nuxt Content, scoped CSS.

## Steps

1. Extend `docs/app/components/PageHead.vue` with article headings and heading levels. Preserve poster and section head behavior.
2. Let `docs/app/components/DocBody.vue` render a supplied ContentRenderer value. Remove its independent reading-width limit.
3. Add `docs/app/components/DocPage.vue` for reading width, optional page heading, prose and default content slots. Add `DocSection.vue` for repeated sections with optional link, metadata and actions.
4. Migrate `docs/app/pages/docs/[...slug].vue`, `components/index.vue`, `components/[concept]/index.vue`, `components/[concept]/[name].vue`, `changelog.vue` and `[...slug].vue`. Keep route/data logic and SectionLayout transitions unchanged.
5. Remove duplicated prose styles from `docs/app/components/ComponentApi.vue`. Retain only API-specific column sizing.
6. Run formatting, lint, root and docs typechecks. Report pre-existing failures separately. No UI tests or browser checks. Manual checks cover overview/detail headings, Markdown lists/code/tables, demos, release anchors, narrow layouts and route transitions.

# Draft status and homepage Implementation Plan

**Goal:** Mark every current component as an AI-generated draft awaiting maintainer design review, and redesign the documentation homepage.

**Architecture:** Component reference frontmatter records `designStatus: ai-draft`; the documentation site presents one shared status badge and explanation. The homepage uses existing public components, existing fonts/tokens, and the automatically discovered catalog. No runtime badge is injected into library controls.

**Tech Stack:** Vue script setup, TypeScript, Nuxt Content, vue-i18n, existing @froq/ui components.

## Scope and steps

1. Add draft metadata to `src/components/*/*.md`; basic count and sample review of the delegated mechanical edits.
2. Add the reference schema field in `docs/content.config.ts`, a shared `ComponentStatus.vue`, and translated status copy. Show status on every catalog row, concept entry and component detail.
3. Replace `docs/app/pages/index.vue` with an editorial specimen: identity and entry points, real Choice/Toggle interaction, component concept index, and an explicit draft notice. Desktop split becomes a single column on narrow screens. Preserve header navigation, locale links and theme contract.
4. Record the status in README and the confirmed identity `1000o = 1000-observations` in consumer mapping.
5. Run lint, typecheck and token checks. Per project instructions, do not write UI tests, run browser acceptance, commit or publish. Hand over actual interaction checks to the maintainer.

## Acceptance boundary

Source checks are not visual acceptance. All current components remain AI Draft even if implemented and compiling. No consuming repositories are modified. Homepage preview controls only change their local demo state.

## Result

Implemented. Basic delegated-edit review confirmed 98/98 reference files have the draft field; sampled Button, Sidebar, Skeleton and Badge frontmatter. Full `pnpm check` passed, then scoped homepage/status/catalog/detail lint passed with `--max-warnings 0`. Existing dev server is listening at localhost:3000 from this repository's docs directory. Production artifacts were not regenerated; visual/manual acceptance remains pending. Check both locales/themes, narrow layout, preview radio/switch keyboard behavior, catalog/detail badges and navigation links.

# Site Banner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a reusable site-wide notice Banner and use it for the documentation WIP notice.

**Architecture:** A named region in `src/components/feedback` presents content and optional actions/dismissal. Visibility, focus after removal, routes, persistence and translations belong to callers. The layout reserves space in normal flow and anchors its absolute header to a separate page wrapper below the notice.

**Tech Stack:** Vue script setup, TypeScript, existing tokens, Nuxt/i18n.

---

1. Create `Banner.vue`, `banner.css`, demo and bilingual references in `src/components/feedback`. Props: required accessible `label`, optional `dismissLabel`. Slots: default and actions. Event: dismiss; no automatic timers or model. Status: ai-draft.
2. Export in `src/index.ts`, import CSS in `src/style.css`. Existing discovery supplies catalog and routes.
3. Render above a positioned page wrapper in `docs/app/layouts/default.vue`; add WIP translations and component link.
4. Update README/handoff for 50 components/100 references.
5. Run `pnpm check`, scoped zero-warning lint and `git diff --check`. No UI tests/browser, commits, publishing, consumer writes or unrelated edits. Maintainer checks themes/locales, narrow header wrapping and optional dismissal/focus.

## Result

Implemented and wired through the public package export. Full lint, root/docs typecheck and token checks passed. No new dependency or separate catalog list. The WIP notice is persistent; the sibling demo shows optional caller-owned dismissal. Production output and package artifacts were not regenerated. Manual acceptance remains pending.

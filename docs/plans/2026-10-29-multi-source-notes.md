# Multi-source Notes Implementation Plan

**Goal:** Select one user configuration, read account-linked notes from global and repository sources, default all new Web notes to global storage, and expose an editable all-notes view.

**Architecture:** Node reads a first-existing config (explicit CLI, XDG, ~/.osdash, ~/osdash, then legacy ~/.os and ~/os). The existing workspace credential and legacy note layout remain readable. A local catalog resolves configured checkout globs and Git remotes, assigns stable source references, and enforces read-only repository defaults on every mutation. The authenticated relay carries paginated catalog requests and source-aware note mutations. Vue reuses NoteCard and the existing relay connection.

**Tech Stack:** Node 24 fs glob and child_process, existing YAML parser, Nuxt/Vue script setup, Vitest backend tests. No new dependencies or UI tests.

## Steps

1. Preserve baseline before implementation. Commit existing UI changes, ghfs metadata, and application changes. Run `vp run check` and `vp run test`, then push main. Completed at 933f1ce.
2. Add local/config.ts with strict first-file selection, XDG absolute-path handling, home-relative paths, global default ~/osdash, repository source rules and notification interval. Thread --config through native service definitions and retain --root for legacy workspaces.
3. Extend local/workspace.ts with global and legacy sources plus .osdash/notes in matching checkouts. Resolve identity from explicit repo, upstream, then origin using Git. Keep credentials in their existing workspace. Repo Markdown accepts pr/issue and anchor, UUID filenames supply stable IDs. Preserve unrelated frontmatter on edits. Deny writes to repository sources unless explicitly enabled. Never relocate notes or alter Git ignores.
4. Extend shared/device-relay.ts, local/device-client.ts, device API and client storage composable with source-aware versions and bounded, paginated all-notes enumeration. Account identity remains verified by the existing relay. Add backend coverage for traversal, read-only writes, stale versions, duplicate IDs across sources, global new-note routing, old formats and pagination.
5. Add a Notes view available from desktop/mobile navigation. Search and filter all sources independently of inbox history. Show repo, contribution and source. Reuse NoteCard for edits, copy read-only notes to global storage, and expose errors/conflict drafts without losing text. No browser/UI tests.
6. Add conditional notification polling to the local service if supported by locally available GitHub authentication. Respect GitHub X-Poll-Interval, conditional requests, retry headers and account identity. Keep polling independent of full inbox refresh. Persist notification baseline locally to avoid duplicate alerts.
7. Update docs, run `vp run check`, `vp run test`, `vp run build:local` and production build as appropriate. Probe changed TypeScript/Vue paths with LSP. Document manual UI acceptance. Leave the new implementation in the working tree. The requested pre-implementation baseline is committed and pushed. Do not deploy or migrate the live Mini service automatically.

## Acceptance

- Only one config loads. Invalid selected config is fatal, never a fallback trigger.
- New Web notes write globally, while existing notes save to their original writable source.
- Repo sources are read-only by default, including direct forged API requests.
- Notes from ended contributions remain visible in the catalog.
- External modifications cause a conflict, preserving the Web draft.
- Existing credentials and notes remain in place and accessible with the legacy --root option.

## Verification result

Implemented and verified on Mini. The baseline commit `933f1ce` matches `origin/main`. New implementation changes remain local.

- `vp run check`: passed, including lint, formatting and Nuxt/local CLI/relay type checks.
- `vp run test`: 42 files and 199 tests passed.
- `vp run build`: passed before the directory-naming follow-up, including the CLI checksum, Nuxt production output and native relay bundle. Vite retains its client chunk-size warning.
- `vp run build:local`: passed with unified osdash directory names. An isolated installer check verified the new program directory, checksum, launcher and preservation of an old installation.
- `vp run smoke:relay`: passed against the built Worker and built CLI. The CLI fixture now isolates HOME and XDG configuration and asserts that startup does not create a config file.
- `vp run smoke:service`: passed for isolated macOS launchd services in both legacy and configured modes. The real Mini service was not stopped or restarted.
- LSP: no reported findings. Six Vue paths remained inconclusive in the probe, so full Nuxt typecheck is the completed type verification for those files.
- No UI tests, browser checks, production deployment, note migration or mo/ghfs integration were performed. Manual UI and actual system-notification acceptance are listed in docs/notes.md.

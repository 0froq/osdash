# Local Workspace and Distribution Implementation Plan

**Goal:** Install `os-` without cloning the Web repository, serve an explicit workspace, and persist account-isolated Markdown notes locally.

**Architecture:** Bundle the Node CLI into one ESM artifact and distribute it with a checksum and a user-only installer. `os- serve` captures the working directory (or `--root`) and stores data in `.os/`. The public app issues a short-lived account grant from an authenticated GitHub session. The bridge verifies it directly with the configured Web origin and binds the resulting stable GitHub ID to its local credential.

**Tech Stack:** Node 24, existing Rolldown toolchain, YAML front matter, jose, existing Vue UI and HTTP/unit tests. No npm publication or deployment in this task.

## Scope and safety

Preserve unrelated uncommitted edits. Do not deploy, modify secrets, delete KV records, or move existing notes automatically. Local notes have no cloud fallback. The user must manually accept UI changes. No UI tests or browser automation.

## Tasks

1. Add pure grant issuance/verification with expiry, challenge binding, strict audience/issuer, and authenticated GitHub numeric ID lookup. Add grant tests. Expose authenticated issuance and bearer-grant verification endpoints. Never send GitHub tokens to localhost.
2. Add a workspace store. Initialize `.os/config.json` without overwriting it. Persist `.os/users/<github-id>/notes/<owner>/<repo>/<kind>-<number>/<uuid>.md`. Bound input, validate metadata, reject path traversal and symlinks, and write through temporary files and atomic rename. Test filesystem operations in temporary directories.
3. Extend the bridge protocol with an instance challenge, account binding, note CRUD and note list. Credential expiry/revocation and Origin/Host checks apply to every operation. Recheck credentials after asynchronous grant verification. Test account separation, failed grants, and API validation.
4. Replace source CLI usage with `os- serve [--root DIR]`. Add a `build:local` artifact build and checksum, plus `public/install.sh`. Installation requires supported Node, writes only user-owned program paths, verifies the downloaded bytes before installation, and works from any directory. Test the installer against a local artifact server with a temporary HOME.
5. Wire Web pairing to obtain an account grant, load local notes for the selected card, write locally with explicit error reporting, and keep existing cloud notes read-only. Reset local note state on disconnect/account changes. Keep mock behavior.
6. Update settings instructions, installation copy, docs and workspace structure. Run `vp run check`, `vp run test`, `vp run build`, native CLI and installer smoke checks, and `git diff --check`.

## Verification

Tasks 1–6 are implemented. `vp run check` includes a standalone local CLI type check and passes. `vp run test` passes 33 files and 190 tests. `vp run build` produces the installer, bundled CLI and SHA-256 assets. `git diff --check` passes.

A Node 24.21.0 smoke run on Mini installed into temporary program directories, rejected a corrupted checksum without replacing the installed program, launched from a different directory, checked both root modes, exercised remote account verification, Markdown CRUD and moves, revoked the credential, and confirmed workspace data survives restart. The smoke identity service was a local test fixture. Real GitHub sign-in and browser local network permission remain manual acceptance items.

The Web build still reports a client chunk over 500 kB (532.61 kB, gzip 162.31 kB). No chunk-size threshold was raised. No deployment, commit, KV deletion or migration was performed.

## Explicit follow-up

Browser IndexedDB migration is separate from this filesystem change. Authentication stays server-side. Existing cloud notes remain readable but are not copied, edited or deleted automatically. Installer URLs become usable remotely only after an explicitly authorized deployment. No production-ready browser compatibility claim without manual acceptance.

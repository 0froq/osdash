# Account Device Relay Implementation Plan

**Goal:** Bind one storage device to a GitHub account so every authenticated browser for that account reads and writes the same workspace files.

**Architecture:** Mini maintains an outbound authenticated WebSocket to an account-scoped native Cloudflare Durable Object. Authenticated Nuxt endpoints relay bounded file operations to that connection. Only device credentials, binding metadata and a revision marker are durable in Cloudflare. Note bodies and in-flight requests are never persisted there. Mini confirms filesystem operations before the Web receives success. Offline requests are rejected rather than queued.

**Tech Stack:** Existing Nuxt, jose and Node 24. Native Cloudflare Durable Objects with hibernating WebSockets. Rolldown adds the native class and a thin upgrade handler after the Nitro build, because Void's custom DO module convention does not support Nuxt. Existing Vitest runs backend tests. No UI tests, deployment, Git commits or production resource provisioning in this implementation task.

## Safety and compatibility

Keep the dirty workspace and old KV notes intact. One bound storage device per account. Binding a different device requires explicit unlink first. Use verified numeric GitHub IDs, never a caller-selected login. Persist the device credential privately on Mini and only its hash in Cloudflare. A device credential cannot authenticate browser APIs or another account's object. Reconnect with backoff but never replay note mutations after an uncertain result. File hashes reject stale save/delete requests. No inbound port or public tunnel on Mini is required after binding.

## Tasks

1. Extend sessions with the numeric GitHub ID. Resolve older sessions through a bounded authentication-only identity cache. Test identity resolution and session round trips.
2. Add shared relay message schemas and validation. Add workspace snapshots, file-version checks and private device credential persistence. Test stale update/delete, symlinks, account mismatch and preserved files.
3. Implement `DeviceRelay` as a native Durable Object. Store only binding/hash/revision metadata. Cover single-device registration, revocation, credential validation, pending-request bounds, timeouts, disconnects and correlated results. Exercise it in Miniflare without a UI.
4. Add the post-Nitro entry wrapper, native class export and SQLite migration/binding configuration for production and branch previews. Keep existing domains, KV IDs and OAuth secrets unchanged. Ensure local Nuxt development remains available.
5. Add authenticated device status/note/unlink APIs and a grant-authorized registration API. Same-origin checks protect mutations. Browser APIs route exclusively by the session's verified account. Add HTTP tests.
6. Add a reconnecting outbound Node client and durable workspace credential file. Initial local pairing registers the storage device, subsequent CLI starts reconnect without browser pairing. Test versioned file operations and connection cancellation.
7. Route Web note actions through account APIs rather than loopback. Keep local pairing only for initial binding. Show storage device online/offline state and explicit unlink. Preserve drafts on a transient disconnect, clear private data on account change, and refresh displayed notes when the remote revision changes.
8. Run `vp run check`, `vp run test`, `vp run build`, native CLI/relay smoke checks and `git diff --check`. Record actual coverage and remaining manual checks in `docs/local-connection.md`.

## Manual acceptance after an explicitly authorized release

Bind Mini once, leave `os- serve` running, then log into the same account from Air without local pairing. Read, create, edit, move and delete notes and inspect Mini's files. Confirm another account cannot see them. Stop Mini and confirm saving is unavailable and no write is queued. Restart and confirm automatic reconnection. Unlink and confirm the old credential cannot reconnect. Test stale edits from two tabs and safe conflict reporting. The browser must not claim success without Mini's acknowledgement.

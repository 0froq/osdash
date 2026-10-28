# Optional Local Connection Implementation Plan

**Goal:** Keep the public Web app and GitHub login, with an optional paired local bridge for device configuration and eventually local notes.

**Architecture:** The Web app talks directly to a loopback-only bridge. Pairing explicitly grants one allowed Web origin a short-lived bearer token. Business caches will move to IndexedDB separately. Authentication remains server-side for now.

**Tech Stack:** Node 24 native TypeScript and HTTP, Vue composables, existing Vite+ tests. No new dependencies.

## Editing boundary

Batch 1 avoided UI files while the user was editing. The user subsequently confirmed they are not editing and authorized UI integration. Preserve all existing changes, keep component styles scoped, and leave vendor/ui unchanged. No deployment, domain edits, secret edits, commits, or KV deletion.

## Task 1: Local bridge and protocol

Create `shared/local-bridge.ts`, `local/bridge.ts`, `local/cli.ts`, `local/bridge.test.ts`. Add `local/**/*.test.ts` to `tooling/vite.config.ts`.

- Bind IPv4 loopback only, use a fixed default port and allow an explicit port for development.
- Accept only the configured exact Origin and the actual loopback Host. Reject arbitrary paths and unknown configuration fields at the response boundary.
- Pair with a high-entropy, expiring, one-use code printed in the terminal. Pin the token to the allowed Origin, expire it, and support revocation. Local pairing is a device permission, not proof of a GitHub identity.
- Bound request bodies, refuse other content types, rate-limit failed pairing attempts, disable HTTP caching, and never log tokens or expose secrets or file paths.
- Provide status, pair, read-safe-config, and revoke endpoints. Configuration response contains locale and whether a notes directory has been configured, not its path.
- Test actual HTTP requests for allowed/denied origins and hosts, pairing expiry/replay, token checks, revocation, body limits, and safe config filtering. No UI tests.
- Run `vp run test local/bridge.test.ts` and `vp run check`.

## Task 2: Web connection logic without UI edits

Create `app/composables/useLocalBridge.ts` with explicit connect/pair/disconnect operations. No background scan, auto-pairing, token in URLs, token persistence, or configurable arbitrary network destination. Keep credentials in memory only. Expose connection/config/error state and actual bridge capabilities so the UI cannot advertise unsupported local notes.

Browser permission failures must stay distinguishable from a successful pairing. A failed revoke must not claim server revocation succeeded. Local network access and cross-browser compatibility need manual acceptance later.

## Task 3: Stop cloud note writes

Re-read `server/api/prefs.put.ts`. Reject production note create/edit/move/delete through this API with a clear error, before `writePrefs` is invoked. Preserve mock behavior for design work, existing read access, stars/later, and authentication. Do not delete existing KV notes. Wire local note CRUD and disable note controls later, once the UI editing boundary is agreed.

## Task 4: Usage and checkpoint

Create `docs/local-connection.md` documenting the executable source command, local config example, allowed origin, pairing/revocation, temporary token lifetime, browser permission caveats, and current capability limits. Do not advertise an unpublished package or working local notes.

Run formatting on changed paths, `vp run check`, `vp run test`, and `git diff --check`. Report the batch boundary, user-visible behavior that still needs manual acceptance, and the UI integration handoff.

## Progress checkpoint

- Bridge, CLI, safe configuration, HTTP security tests, and cloud note-write rejection are implemented.
- Settings now includes device pairing, source-run instructions for the current origin, configuration display, cancellation, and revocation.
- Preview note controls and preference mutators stay read-only outside mock mode until local CRUD is implemented.
- Sign-out, account changes, and leaving the inbox clear client credentials and attempt revocation. Stale pairing/config responses cannot restore the old state.
- Manual browser acceptance is pending. No UI tests or browser automation were performed.
- Local note CRUD, account-bound note permission, and IndexedDB migration are still follow-ups.

## Follow-up: Local notes

Persist notes in a user-selected local directory through restricted CRUD operations, not arbitrary filesystem APIs. Add atomic writes and account/workspace isolation. Connect existing note actions to the bridge. No cloud fallback and no local notes advertised until the whole path works. Preserve existing KV notes until an explicit migration/export decision.

## Follow-up: Browser storage

Move GitHub inbox/timeline caches and seen/star/later to account-scoped IndexedDB. Keep authentication storage separate. Preserve lazy timeline loading, coalescing, TTLs, cooldowns, pagination and concurrency bounds. Stop business KV reads/writes only after the browser path is integrated. Do not replace absent KV with process-global storage in production.

## Manual acceptance (user)

After UI integration, use the public HTTPS origin to pair on a supported browser, approve local network access, inspect the safe config, revoke, restart the bridge, switch GitHub accounts, and confirm local note controls stay disabled until supported. No browser automation or UI tests.

## References

- https://developer.chrome.com/blog/local-network-access
- https://developer.chrome.com/release-notes/142
- https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content

Loopback trust, CORS, and browser local network permission are separate checks. Browser compatibility is not established by unit or HTTP integration tests.

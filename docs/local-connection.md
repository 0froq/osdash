# Account-bound storage device

The public Web app uses `https://osdash.froq.me`. One storage device, such as Mini, holds an account's Markdown notes. Every browser signed into that GitHub account uses that device through an authenticated Cloudflare relay. Air does not need its own CLI or local pairing.

The matching account-relay Web build and CLI are deployed at the public origin. The first native Durable Object migration required `pnpm run deploy --atomic`. Void completed the atomic release and readiness check successfully. Public HTTP checks confirmed the installer, CLI checksum and device endpoints. Existing OAuth configuration, secrets and KV notes were not changed. Signed-in Mini/Air behavior still needs manual acceptance.

## Install and bind

Requires `curl` and Node 24.21.0 or Node 26+. Stop any older CLI process, update the program, then run on the machine that will store the notes:

```sh
curl -fsS https://osdash.froq.me/install.sh | sh
mkdir -p ~/os
os- serve --root "$HOME/os" --name Mini
```

`~/os` is separate from mo-managed source repositories in `~/code`. A root must already exist. Without `--root`, the CLI uses its current directory. It does not scan repositories or parent directories.

`os- serve` installs a per-user background service and then exits. On macOS it uses launchd. On Linux it uses a systemd user service. The service starts after OS login and restarts if the process exits. Close Terminal after the pairing instructions print. The service runs the same program with `serve --foreground`. Use `--foreground` yourself only for scripts or platforms without launchd or a systemd user session.

On Mini, sign into the Web app, open Settings → Storage device, and paste the one-use code within five minutes. Allow local network access if prompted. Use only the website printed by the CLI. `os- restart` prints a fresh code. `os- status` shows the process. `os- stop` stops it and disables automatic startup. Files and the account binding stay.

After binding, Air only needs to sign into the same GitHub account. The Web uses the account's storage device, not Air's loopback. Mini keeps an outbound WebSocket open. No inbound port, public tunnel or router configuration is required.

Browser reloads and browser sign-out do not unbind it. Sleep, shutdown or logging out of the OS user takes the device offline. Running a second `os- serve` does not replace a healthy service. Change the workspace only after `os- stop`. Service files live under `~/.local/state/os/` and the platform's per-user service directory. Logs are private. The CLI refuses to overwrite an unmanaged service definition.

An account can bind one device. To replace it, explicitly unlink the old device in Settings, then bind the new one. Files are not copied automatically. Unlinking revokes the cloud credential and closes its connection but does not delete local files. A workspace also belongs to one saved device identity. Use a separate workspace for another account.

## Installation and updates

The installer writes `~/.local/share/os/bridge.mjs` and `~/.local/bin/os-`. It verifies SHA-256 before replacing program files. This is download-integrity checking, not an independent publisher signature. It does not use sudo, modify shell configuration or create workspace data. Add `~/.local/bin` to PATH yourself if needed. Run the same installer to update.

`OS_INSTALL_HOME` and `OS_BIN_DIR` override program directories. `OS_INSTALL_BASE_URL` selects another deployment's distribution origin. HTTP is accepted only for loopback development. These settings do not move workspace data.

## Workspace files

```text
~/os/
  .os/
    .gitignore
    config.json
    device.json
    users/
      12345/
        notes/
          owner/
            repo/
              pr-42/
                <uuid>.md
```

Startup creates `.os/config.json` and `.os/.gitignore` exclusively. The ignore file contains `*`. Existing tracked files and custom ignore rules remain the user's responsibility. Note directories are created lazily.

```json
{
  "version": 1,
  "origin": "https://osdash.froq.me",
  "locale": "system"
}
```

`locale` accepts `system`, `en` or `zh-CN`. Unknown fields remain untouched. A mismatched origin or malformed configuration fails closed. Changing websites requires deliberate configuration review, a matching `--origin`, and a compatible device credential. Previous XDG files are not read or modified.

`device.json` stores the device's numeric GitHub identity, UUID, origin, display name and random credential. It is written with mode `0600`. Do not publish it. Back up `.os/` securely. There is no automatic backup or replication between devices. Web access from Air still writes Mini's files.

Each note is one Markdown file:

```md
---
id: a1234567-1234-4567-89ab-123456789abc
repo: owner/repo
kind: pr
number: 42
anchor: 2026-10-26T00:00:00.000Z
createdAt: 2026-10-26T01:00:00.000Z
updatedAt: 2026-10-26T01:00:00.000Z
---
# My note

- [ ] Follow up on this review
```

Editing and moving preserve filename, ID and creation time. A move changes `anchor`. Filesystem writes use private temporary files, file sync and atomic rename. Symlink workspace directories, config files, credential files and note files are rejected. Malformed existing files are not overwritten or deleted through the API. Note text is limited to 64 KiB and a listing to 2,000 notes, also subject to the bounded relay response size.

The workspace is trusted local storage, not a sandbox against malicious processes running as the same OS user. Atomic replacement does not provide a transaction with an unrelated external editor. Avoid editing the same file simultaneously with a local editor.

## Authentication and data flow

Initial binding uses loopback protocol **3**:

1. The bridge binds only `127.0.0.1:47831` and issues a process challenge and one-use code. Five failed code attempts lock it until restart.
2. An authenticated same-origin Web request obtains a 90-second grant. The server checks the GitHub token's actual numeric ID. The grant includes the bridge challenge, origin and `device:bind` purpose, without a GitHub token.
3. The bridge verifies the grant with the configured website, registers a random durable device credential, and confirms an authenticated outbound connection before completing pairing.
4. The browser receives a separate eight-hour in-memory token for local setup/configuration. Forgetting that token does not unlink remote storage.

Normal note operations use authenticated `/api/device/notes` requests. They route exclusively by the session's verified numeric GitHub ID. Older sessions resolve their ID through a short-lived authentication-only cache. A caller-supplied login, account ID or filesystem path cannot select another account's workspace.

The native `DeviceRelay` Durable Object holds binding metadata, a SHA-256 credential hash and a revision marker. Note bodies and pending operations are not written to its durable storage or to business KV. TLS protects browser-to-cloud and device-to-cloud traffic. The cloud processes plaintext note content transiently. This is not end-to-end encryption.

The credential authenticates only the device connection, not browser APIs. Browser mutations require the exact same Origin as their authenticated session. The CLI never receives a GitHub token. Its outbound socket uses a validated credential subprotocol, not query-string credentials.

## Offline behavior, conflicts and drafts

Mini must acknowledge the actual filesystem operation before the Web reports success. Offline operations fail without being queued. Requests time out after 20 seconds. Both sides bound pending work to 16 operations. The CLI rejects expired requests before starting them. Keep the device's system clock accurate. Disconnects fail pending requests. There is no automatic mutation retry or reconnect replay.

A transport failure can leave a write's outcome uncertain. Keep the tab open, reload notes to inspect the device's state, then retry deliberately. The UI does not claim that an ambiguous failure left the file unchanged.

Snapshots include SHA-256 file versions. Editors capture the version when editing starts, so background refresh cannot silently authorize an older draft to overwrite a newer file. Save and delete reject stale versions. A save conflict keeps the user's text as a separate unsaved draft and reloads the current original for comparison. Saving an empty editor does not implicitly delete a file.

Notes load when opening a contribution. While online, device status is polled every 15 seconds. An acknowledged remote mutation changes the revision and refreshes the open contribution. External file edits require Reload notes or reopening the contribution. Only the device's notes are editable. Existing cloud notes remain read-only.

A transient disconnect disables mutation controls but keeps the open editor and tab-memory drafts. Reloading the page, signing out, changing accounts or unlinking clears those private drafts. There is no persisted browser draft recovery. Save before moving. The move selector and delete action are unavailable while editing.

## APIs and deployment

Browser endpoints:

- `GET /api/device/status`: account's bound device, online state and revision.
- `GET /api/device/notes?unit=...`: notes and file versions from the device.
- `POST /api/device/notes`: versioned save, including `version: null` for creation.
- `DELETE /api/device/notes`: versioned delete.
- `DELETE /api/device`: explicit unlink of the displayed device UUID.

CLI endpoints are `POST /api/device/register` and `/api/device/socket`. Registration requires the short-lived binding grant. Socket authentication uses the persisted device credential. `POST /api/local/verify` must remain reachable by the CLI. Cloudflare Access protection can block initial verification or socket connectivity. Do not disable Access or change OAuth settings automatically to work around it.

Local `/v1/status`, `/v1/pair` and `/v1/config` retain exact Origin, actual loopback Host, no-store responses, bounded JSON and token checks. Compatibility `/v1/notes` endpoints remain available, but the Web's note actions use the account relay.

The native relay is bundled after Nitro. `tooling/relay-entry.mjs` wraps its Worker entry, forwards socket upgrades and exports `DeviceRelay`. Production config adds the `DEVICE_RELAY` binding and SQLite migration `device-relay-v1`. Preview config exports the same class with a `preview` scope, separate from production's default `production` scope. Existing domains, KV IDs and OAuth secrets are retained. Void's build updates `void.lock.json` with the new binding and migration metadata. The existing production account ID and KV namespace IDs remain unchanged. A successful local build does not provision a production Durable Object namespace.

`vp run dev` remains available for the dashboard. Account relay operations require the native Workers runtime and are exercised in Miniflare tests. The plain Nuxt development server does not implement a replacement relay.

## Existing storage and distribution

Legacy cloud notes are neither migrated nor deleted. Real note mutations through `PUT /api/prefs` still fail with `LOCAL_NOTES_REQUIRED`. Mock note interactions retain their demo behavior. Authentication, non-note preferences and existing business caches keep their previous storage. IndexedDB migration is separate work.

`vp run build:local` bundles the CLI and YAML parser into ignored `public/downloads/os-bridge.mjs` and its checksum. `vp run build` also builds Nitro and the native relay wrapper. Publish matching Web and CLI versions. Do not publish only one side of a protocol upgrade. `--port` is for local scripts. Initial browser binding currently uses fixed port 47831.

Removing the launcher and program directory does not delete workspaces or revoke a bound device. Unlink before uninstalling if remote access should be revoked.

## Verification and manual acceptance

Backend coverage includes a real Miniflare SQLite Durable Object, an actual outbound Node WebSocket and temporary workspace files. Tests exercise registration, account isolation, note CRUD/move, stale writes/deletes, disconnect, restart/reconnect, revocation, private credential files and absence of note bodies or raw credentials in relay storage. HTTP tests check session-based routing, legacy-session identity resolution and caching, Origin rejection and request bounds. Native tests also cover pending-request limits and expired mutations.

Verified on Mini with Node 24.21.0:

- `vp run check`: lint, formatting and Nuxt/CLI/native-relay types pass.
- `vp run test`: 38 files, 200 tests pass.
- `vp run build`: Web, CLI, native class and Worker wrapper build successfully.
- `vp run smoke:relay`: the built Worker serves `/login` with 200 and rejects unauthenticated device/status and socket requests with 401. It also exercises signed device registration, idempotent retries, invalid grants, request-size limits, binding conflicts and authenticated socket probes. The built CLI passes help, checksum, foreground startup, protocol and canonical-origin checks in a temporary workspace.
- `vp run smoke:service`: the built CLI installs an isolated macOS launchd service, prints pairing instructions, stays idempotent, restarts, stops and keeps the temporary workspace. The service process is parented by launchd.
- `git diff --check`: passes.

The existing Nuxt dev server on Mini still returns 200 for `/login`. No other dev process was stopped. The client chunk warning remains: 537.80 kB minified, 163.86 kB gzip, above the 500 kB warning threshold. No threshold change or chunk-optimization work is included. `os- serve` now installs a per-user background service. Mini's earlier hand-written launchd job was unloaded and archived. The published installer replaced the program, and the CLI created its own service for `~/os`. That process is parented by launchd, listens on loopback, and reconnected as online. The saved device credential and notes were kept. The first real Workers deployment completed successfully. Production `/`, `/login`, installer and CLI downloads returned 200. Device status and socket endpoints rejected unauthenticated requests with 401. The published CLI matched both its checksum and the local release artifact and passed `--help` with storage-device options. Signed-in browser behavior remains unverified.

The first manual pairing attempt exposed a Workers-only request-body bug. The handler waited for Node data/end events that Nitro's adapter does not emit, causing registration to hang and return 500. Body reading now uses H3's Web Stream adapter on adapted requests, with the same 80 KiB bound. The original Node stream path remains bounded. A Fetch-adapter unit test and the signed built-Worker registration smoke check cover this regression. The fix is deployed. Production probes returned 403 for an invalid grant, 400 for malformed JSON and 413 for an oversized body, without creating a device binding. Mini's saved identity and notes were not changed.

No UI tests or browser automation are used. The matching build is now published. Check manually:

- Update the CLI on Mini, bind it from Mini's browser, then sign into the same account on Air without local pairing.
- Read, create, render, edit, move and delete notes from Air. Inspect the actual files on Mini. Confirm old cloud notes remain read-only.
- Edit the same note in two tabs. Save one, wait for background refresh, then save the older editor. Confirm the original is not overwritten and the losing edit remains as an unsaved draft.
- Stop Mini during an edit. Confirm controls disable without erasing the editor, no success is claimed and no write is queued. Restart and confirm automatic reconnection.
- Sign into another account. Confirm it cannot access Mini's notes. Sign-out must clear private tab state without unlinking Mini for other sessions.
- Unlink Mini with confirmation. Confirm its files remain, old credentials stop working and a replacement device can be bound explicitly.
- Check local-network permission during initial binding, Markdown layout, conflict copies, folded comments and timeline rail geometry by hand. Unsaved notes and in-flight edits should keep the Unsaved marker until the device acknowledges saving.

Chrome Local Network Access affects initial loopback pairing only. Keep Origin, CORS and token checks. Do not disable browser security or install an insecure certificate.

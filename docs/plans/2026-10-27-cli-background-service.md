# CLI Background Service Implementation Plan

**Goal:** Make the distributed `os- serve` start managed background storage without a terminal session or hand-written machine configuration.

**Architecture:** The CLI uses native per-user services: launchd on macOS and systemd on Linux. Services run the same installed program with `serve --foreground`. The parent waits for startup and prints the fresh pairing instructions, then exits. `status`, `stop` and `restart` manage the saved configuration. Unsupported platforms fail explicitly with a foreground option. No npm daemon dependency, sudo, new cloud resource or note migration.

**Tech Stack:** Node 24 standard library, existing Rolldown CLI bundle and Vitest backend tests.

## Tasks

1. Add `local/service.ts`. Derive every path from the current user's home, the actual Node executable and CLI entry. Store a private service descriptor and private logs. Render escaped native service definitions, preserve workspace identity, reject conflicting configurations, and expose start/status/stop/restart. Derive the service label from home so isolated HOME smoke tests cannot control the user's real service.
2. Update `local/cli.ts`. Default `serve` to managed mode and add `--foreground` plus lifecycle commands. Keep the existing loopback, grants and outbound relay unchanged. Wait for the child startup before printing pairing instructions. Repeated serve must not silently replace another workspace or restart a healthy service.
3. Add backend service tests with a fake native manager, plus a built-CLI isolated-HOME launchd smoke on Mini. Check escaping, configuration ownership, idempotence, failure, lifecycle and detached process parenting. Update existing foreground smoke calls to use `--foreground`.
4. Update installer instructions and `docs/local-connection.md`. Run check, test, build, relay smoke and native service smoke. Do not add UI tests.
5. Publish matching artifacts through Void. On Mini, stop the earlier manually managed job before replacing the installed CLI, archive its plist, then let the published CLI create and manage the real service. Preserve the workspace, device credential and notes. Verify native service state and outbound online confirmation. No Git commit or push.

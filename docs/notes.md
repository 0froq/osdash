# Configuration and multi-source notes

The Web app and local CLI must be updated together for the all-notes catalog and source-aware edits. This document describes the implementation in this checkout, not a completed production release.

## Select one configuration

`os- serve` loads the first existing file in this order:

1. Explicit `--config <file>`. A missing explicit file is an error.
2. `$XDG_CONFIG_HOME/osdash/config.json`, or `~/.config/osdash/config.json` if the variable is absent or relative.
3. `~/.osdash/config.json`.
4. `~/osdash/config.json`.
5. Legacy `~/.os/config.json`.
6. Legacy `~/os/config.json`.
7. Built-in defaults if no file exists.

Only one file is selected. Fields are not merged with lower-priority files. An unreadable, symlinked, oversized or malformed selected file fails startup. Invalid selected settings never trigger a fallback. No configuration file is created automatically, so starting with defaults does not shadow a later fallback file.

Example `~/.config/osdash/config.json`:

```json
{
  "version": 1,
  "origin": "https://osdash.froq.me",
  "locale": "system",
  "workspaceDirectory": "~/osdash",
  "notesDirectory": "~/osdash/notes",
  "repoDirectories": [
    {
      "pattern": "~/code/0froq/special-fork",
      "repo": "upstream/project",
      "writable": false
    },
    "~/code/0froq/*"
  ],
  "notifyPollSeconds": 10
}
```

`locale` is `system`, `en` or `zh-CN`. JSON paths expand `~` and resolve relative paths against the user's home. CLI `--config` and legacy `--root` resolve relative arguments against the terminal's current directory. Environment variable substitution and shell expansion are not performed inside JSON. `workspaceDirectory` defaults to `~/osdash`. `notesDirectory` defaults to `<workspaceDirectory>/notes`, and may point to another disk.

Start with `os- serve --name Mini`, or pin a file with `os- serve --config ~/.config/osdash/config.json --name Mini`. Native service definitions retain the selected config path and the installing user's HOME and PATH. Credentials are not copied into service definitions. New service state and logs use `~/.local/state/osdash/`. An existing service descriptor under `~/.local/state/os/` remains discoverable and keeps its old log paths. Paths are not moved automatically. The installer places the program in `~/.local/share/osdash/`; it leaves an old `~/.local/share/os/` program intact for existing launchd/systemd definitions. The command remains `os-`.

The chosen config is re-read before note operations and notification polls. Source patterns, write permissions, locale and polling interval can change without restarting. Changes to storage paths or origin require stopping and starting the service. Changing the workspace selects its device credential, so an empty replacement workspace needs binding. No files are migrated automatically.

## Global storage is the default write target

New Web notes always go to the global directory:

```text
~/osdash/
  device.json
  notifications-12345.json
  notes/
    12345/
      upstream/
        project/
          pr-42/
            <uuid>.md
```

The numeric account ID isolates global notes. `device.json` is private device authentication metadata. Notification state contains thread IDs and update timestamps, not the GitHub token. Neither file belongs in a source repository.

Global Markdown retains its self-contained frontmatter:

```md
---
id: a1234567-1234-4567-89ab-123456789abc
repo: upstream/project
kind: pr
number: 42
anchor: 2026-10-29T10:00:00.000Z
createdAt: 2026-10-29T11:00:00.000Z
updatedAt: 2026-10-29T11:00:00.000Z
---
Check the retry behavior before following up.
```

`anchor` is where the note belongs in the contribution timeline. Creation and modification time are separate from that position. Editing existing writable notes saves to their original source, regardless of the default write directory.

## Repository sources

Each `repoDirectories` entry is a checkout directory glob or an object with `pattern`, optional `repo`, and `writable` (default false). The service only traverses `.osdash/notes` inside matching directories. It does not search unrelated repositories. Overlapping patterns are deduplicated by canonical checkout path. The first matching entry wins, so put overrides before broad patterns.

Without a `repo` override, the directory must be a Git checkout root. Repository identity comes from its local `upstream` remote, then `origin`. HTTPS and Git SSH URL strings are understood, but discovery only reads local Git configuration. It never contacts the remote or uses SSH. An ambiguous or unsupported remote produces a source warning instead of guessing from the folder name. A Git worktree root is supported.

For example, checkout `~/code/0froq/lig` can have an `upstream` pointing to another owner's project. Its notes are attributed to that upstream repository. A repo note can be named `<uuid>.md` and contain only:

```md
---
pr: 525
anchor: 2026-10-29T10:00:00+08:00
---
The failing test now passes locally.
```

Use `issue: 523` instead of `pr: 525` for an issue. Exactly one is required. The UUID filename supplies a stable note ID. A descriptive filename also works if frontmatter provides an `id` containing a UUID v4. Optional `createdAt` defaults to `anchor`. Optional `updatedAt` defaults to file modification time for sorting. Existing unrelated frontmatter values survive Web edits, though YAML formatting and comments may change.

Nested Markdown directories under `.osdash/notes` are supported up to 10 levels. Symlinks are skipped, and malformed files are reported in source warnings. Duplicate IDs in one source are rejected. Identical IDs in different sources are separate notes, identified by source and ID together. Repository notes are accessible only to the device's bound account, since the files do not carry account identity.

Repository sources are read-only unless explicitly configured with `writable: true`. This is enforced on the device for save and delete requests, including forged requests that supply `writable: true`. Writable repo sources permit edits and deletion of existing notes. They still do not receive newly created Web notes.

The service does not modify `.gitignore`, stage files or make commits. Web edits to tracked repo notes create Git differences. Unignored new files appear as untracked. The default read-only policy avoids remote Web edits changing a checkout. Choose whether to version repository notes yourself. Editing global notes does not touch any checkout unless you deliberately configure the global directory inside one.

## Legacy workspaces

Existing `os- serve --root ~/os` continues using `~/os/.os/device.json` and reads its old `users/<account>/notes/...` tree. Those notes appear as a separate writable legacy source. New Web notes go to the configured global directory. Old files, device credentials and Git ignores are not moved or removed.

The legacy `.os/config.json` is left untouched and is not read as a second configuration. To use it as the selected config, pass its path explicitly with `--config`. The saved device credential still validates its origin. Existing background service descriptors without the new configured-mode flag retain their `--root` invocation when restarted.

## Notes in the Web app

Choose **Notes** in desktop or mobile navigation, or open `/?view=notes`. Direct entry reads the session profile and device catalog without refreshing the GitHub inbox. The catalog includes old contributions outside the inbox's 14-day window. It is paginated by stable source/unit/note keys with a bounded response size. The Web loads all pages before applying search and filters, so a filter is not limited to the first page.

Search matches note text and contribution identity. Filters select repository and source. Sorting uses edit time or timeline position. Each note shows its repository, PR/issue, source directory and timeline position. Notes on currently loaded inbox cards have a timeline link. Every note links to its GitHub item, including old items not present in the inbox cache.

Existing writable notes use the same Markdown editor as the contribution timeline. New notes require a repository, kind, number and ISO anchor timestamp and save globally. Read-only notes offer **Copy to global notes**, which creates an unsaved independent draft. Saving it leaves the original file untouched.

Save and delete require the SHA-256 version captured before editing. An external file change causes a conflict. The Web reloads the original and preserves the user's text as a separate unsaved global draft. A failed or ambiguous operation keeps the draft visible instead of reporting success. Device disconnection disables mutations. Drafts survive switching between Home and Notes in the same page session, but are not persisted across reload/sign-out/account change.

Use **Reload notes** after changing files outside the Web app. Remote Web mutations update the relay revision, which triggers catalog refresh. Source discovery does not require an active inbox card.

## Local GitHub notifications

`notifyPollSeconds` defaults to 10. Set it to 0 to disable polling. Other values must be integers from 10 to 86400. The effective interval is the larger of that setting and GitHub's `X-Poll-Interval`. GitHub commonly asks for 60 seconds. Rate limits honor `Retry-After` and the rate-limit reset time.

The poller runs only after device binding. It uses `GITHUB_TOKEN`/`GH_TOKEN` from the foreground process or `gh auth token --hostname github.com --user <paired-login>` from local gh authentication. It verifies the token's numeric GitHub account ID before fetching notifications. The local account must match the paired account and have notification scope. A Web login does not install a local GitHub token. Managed services retain PATH for locating gh, but do not persist token environment variables. Prefer gh's local credential store for a background service.

Only `GET /notifications?participating=true&all=false` is polled. It does not refresh GraphQL searches or contribution timelines. `If-Modified-Since` reuses GitHub's `Last-Modified`. GitHub states that a 304 response leaves the primary rate limit untouched. See [GitHub notification polling](https://docs.github.com/en/rest/activity/notifications#about-github-notifications).

The first successful poll establishes a quiet baseline. Later polls detect new threads and newer `updated_at` values on existing unread threads. The baseline persists across restarts. A burst shows at most five individual alerts and one summary. This follows GitHub notification activity, so it can also alert for a review or state change. It is not a raw feed of every comment, and a thread already read elsewhere before polling may not appear.

macOS uses `osascript` notifications on the storage device, such as Mini. Linux uses `notify-send` in the user's desktop session. System notification permissions and a usable gh login are required. Errors pause polling and leave notes available. Notifications do not mark threads read or modify GitHub. They do not automatically appear on Air.

## Manual acceptance

No UI tests or automated browser checks are added. After publishing matching Web and CLI versions:

- Bind Mini and open Notes from Air with the same GitHub account.
- Confirm a repo note is visible as read-only, including one for a contribution outside the inbox window.
- Create and edit a global note, then check its actual Markdown file on Mini and verify repo Git status is unchanged.
- Copy a repo note globally and save the copy. Confirm the original file is unchanged.
- Enable writes for one explicit source, reload, edit it, and confirm the expected repo file diff.
- Edit the same file in a local editor while its Web editor is open. Confirm conflict handling preserves both versions.
- Switch Home/Notes with an unsaved draft, then test offline/reconnect and small-screen layout.
- Allow system notifications on Mini and verify an updated participating thread produces an alert after the effective poll interval. Confirm restarting does not replay the initial unread backlog.

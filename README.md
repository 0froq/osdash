# osdash

Multi-user, read-only inbox of your open-source contributions. Each visitor signs in with GitHub OAuth and sees their own PRs and issues (open items plus those closed in the last 14 days). Production: `osdash.froq.me`.

## Architecture

- **Nuxt 4** on **Cloudflare Workers** (Nitro `cloudflare-module`). Production deploys with **Void** (`void.config.ts`); branch previews use `cloudflare.config.ts`.
- **GitHub OAuth** (`read:user`): callback exchanges the code for a user access token, encrypts it with **AES-GCM** (`SESSION_SECRET`), stores it in **KV** under `session:v1:*`, and sets an **httpOnly** session cookie. The browser never sees the GitHub token.
- **Inbox data**: GraphQL search per logged-in user. A contribution card groups the viewer's PR with its closing or mentioned issues. Responses are cached in **KV** per user (`inbox:v1:{login}`) with **stale-while-revalidate**. Per-user read state, stars, and snooze live in the same KV under `seen:v1:{login}` and `prefs:v1:{login}` (no TTL). Timeline responses are cached as `tlresp:v2:{login}:{unitId}:{membersHash}`.
- **HTTP**: `GET /api/inbox`, `GET /api/timeline?id=`, `POST /api/seen`, `PUT /api/prefs`. `?refresh=1` skips the KV read.
- **Turn classification**: existing rules unchanged. **Workers AI clef** runs for logins listed in `OSDASH_CLEF_LOGINS` (comma-separated, case-insensitive). Other users can opt into the same prompts via **BYOK** (OpenAI-compatible base URL, API key, model) stored encrypted per user in KV.
- **Cloudflare Access**: JWT middleware runs only when `OSDASH_ACCESS_ENFORCE=true` (branch previews). Production leaves it unset (unset means off).

## Secrets and KV

| Name                   | Where              | Purpose                                                          |
| ---------------------- | ------------------ | ---------------------------------------------------------------- |
| `GITHUB_CLIENT_ID`     | Worker secret      | OAuth app client ID                                              |
| `GITHUB_CLIENT_SECRET` | Worker secret      | OAuth app client secret                                          |
| `SESSION_SECRET`       | Worker secret      | AES-GCM key for session + BYOK blobs                             |
| `CACHE`                | KV binding         | Sessions, inbox cache, seen/prefs, classifier cache, OAuth state |
| `AI`                   | Workers AI binding | Clef for logins in `OSDASH_CLEF_LOGINS`                          |
| `OSDASH_CLEF_LOGINS`   | var or secret      | Comma-separated logins. Production example: `0froq`              |
| `ACCESS_TEAM_DOMAIN`   | Worker secret      | Preview only (when Access enforced)                              |
| `ACCESS_AUD`           | Worker secret      | Preview only                                                     |
| `GITHUB_TOKEN`         | Optional legacy    | Not used for per-user inbox loads; keep empty in new deployments |

Production (Void):

```sh
void secret put GITHUB_CLIENT_ID
void secret put GITHUB_CLIENT_SECRET
void secret put SESSION_SECRET
```

Preview (`cloudflare.config.ts`) needs the same secrets plus Access values; set build/env `OSDASH_ACCESS_ENFORCE=true`.

### GitHub OAuth app

1. GitHub → Settings → Developer settings → OAuth Apps → New.
2. Homepage URL: your deployment origin (e.g. `https://osdash.froq.me`).
3. Callback URL: `https://main-osdash.sayhola.workers.dev/api/auth/callback`.
   GitHub allows one callback. Branch previews set `OAUTH_CALLBACK_ORIGIN=https://main-osdash.sayhola.workers.dev` and send that redirect URI. The preview at that origin checks the signed state and redirects the code back to the branch that started login. Production and local leave the variable unset and keep using their own `/api/auth/callback`.
4. No extra scopes beyond `read:user` (requested in code).

## Local development

Node **24.21.0**. Create `.env` (not committed):

```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
SESSION_SECRET=long-random-string
GITHUB_TOKEN=unused-for-oauth
ACCESS_TEAM_DOMAIN=
ACCESS_AUD=
OSDASH_ACCESS_ENFORCE=false
```

Then:

```sh
pnpm install
pnpm exec vp run dev
```

Open http://localhost:3000 with no query params to use GitHub login. Unauthenticated requests go to `/login`.

**Sample inbox (no GitHub):** open http://localhost:3000/?mock=1, or set `OSDASH_MOCK=1` in `.env`. Production builds ignore both (`import.meta.dev` is false).

**Real GitHub locally:** set the OAuth secrets above, register callback `http://localhost:3000/api/auth/callback`, then sign in via `/login`. Do not set `OSDASH_MOCK` and do not add `?mock=1`.

## Checks

```sh
pnpm exec vp run check
pnpm exec vp run test
```

## Deploy

Production: `pnpm exec void deploy --platform cloudflare` on `main`. Branch previews: `pnpm preview:deploy`. See `AGENTS.md` for Workers Builds details.

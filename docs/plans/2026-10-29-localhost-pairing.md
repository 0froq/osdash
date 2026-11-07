# Production and localhost pairing

**Goal:** Keep Mini connected to production while a separate local profile connects to localhost:3000 and the same account's note sources.

**Architecture:** A development-only Nitro plugin runs the existing native Durable Object relay in Miniflare. HTTP APIs receive its real namespace binding. An authenticated socket probe advertises the local relay's loopback WebSocket origin to the CLI. Managed CLI profiles use separate launchd labels, state directories, ports and device credentials. Note sources remain shared. Production does not include the development runtime.

## Implementation

1. Add a reusable local relay runtime and a dev-only Nitro plugin. Persist only local relay binding metadata in ignored cache storage. Exercise actual namespace RPC, socket authorization and restart persistence in backend tests.
2. Add a dev socket probe endpoint and validate advertised socket origins. Production origins must ignore any override. Local overrides must remain HTTP loopback origins. Continue using the existing device authentication and account verification.
3. Add managed service profiles, profile config discovery and separate deviceDirectory storage. Keep default-profile labels and production credentials unchanged. Use port 47832 and a dedicated browser bridge URL for the local profile.
4. Preserve old Web client note operations during the CLI update: provide unambiguous legacy version aliases, infer an omitted source only from a unique matching version, and continue enforcing read-only permissions.
5. Configure Mini's local profile from the existing note-source settings, disable duplicate notification polling, build/install the matching CLI, and start the local profile. Keep production bound and verify both connections.
6. Pair localhost through authenticated backend requests using the verified local GitHub account. Do not automate or test the UI. Verify both relay statuses and shared note enumeration without creating fake user notes.
7. Run check, backend tests, build and relevant service/relay smoke commands. Record manual UI behaviors and operating instructions. Do not publish the Web app or change production secrets.

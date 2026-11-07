#!/bin/sh
set -eu

base=${OS_INSTALL_BASE_URL:-https://osdash.froq.me}
base=${base%/}
case "$base" in
  https://*|http://127.0.0.1:*|http://localhost:*) ;;
  *) echo 'Use an HTTPS distribution origin (HTTP loopback is for development only).' >&2; exit 1 ;;
esac
command -v node >/dev/null 2>&1 || { echo 'Install Node 24.21.0 or Node 26+ first.' >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo 'curl is required.' >&2; exit 1; }
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(!((a===24&&b>=21)||a>=26)){console.error("Node 24.21.0 or Node 26+ is required.");process.exit(1)}'

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
curl --fail --silent --show-error --max-time 60 "$base/downloads/os-bridge.mjs" -o "$tmp/os-bridge.mjs"
curl --fail --silent --show-error --max-time 60 "$base/downloads/os-bridge.mjs.sha256" -o "$tmp/os-bridge.mjs.sha256"
node --input-type=module - "$tmp" <<'JS'
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

const source = process.argv[2]
const bytes = await readFile(join(source, 'os-bridge.mjs'))
const expected = (await readFile(join(source, 'os-bridge.mjs.sha256'), 'utf8')).trim()
const actual = createHash('sha256').update(bytes).digest('hex')
if (expected !== `${actual}  os-bridge.mjs`) throw new Error('Checksum mismatch. Nothing was installed.')
const directory = process.env.OS_INSTALL_HOME || join(homedir(), '.local', 'share', 'osdash')
const bin = process.env.OS_BIN_DIR || join(homedir(), '.local', 'bin')
if (!isAbsolute(directory) || !isAbsolute(bin)) throw new Error('Installation directories must be absolute')
await mkdir(directory, { recursive: true, mode: 0o700 })
await mkdir(bin, { recursive: true, mode: 0o700 })
async function replace(path, content, mode) {
  const temporary = `${path}.install-${process.pid}`
  try {
    await writeFile(temporary, content, { flag: 'wx', mode })
    await rename(temporary, path)
  } finally { await rm(temporary, { force: true }) }
}
const program = join(directory, 'bridge.mjs')
await replace(program, bytes, 0o600)
const launcher = `#!/usr/bin/env node\nimport(${JSON.stringify(pathToFileURL(program).href)}).catch(error => { console.error(error.message); process.exitCode = 1 })\n`
await replace(join(bin, 'os-'), launcher, 0o700)
console.log(`Installed: ${join(bin, 'os-')}`)
if (!(process.env.PATH || '').split(':').includes(bin)) console.log(`Add this directory to PATH: ${bin}`)
console.log('Start the storage service: os- serve')
console.log('That starts a background service. You can close Terminal.')
console.log('Installation does not create a workspace or change shell configuration.')
JS

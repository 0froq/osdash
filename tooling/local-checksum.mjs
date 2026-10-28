import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const file = new URL('../public/downloads/os-bridge.mjs', import.meta.url)
const digest = createHash('sha256')
  .update(await readFile(file))
  .digest('hex')
await writeFile(
  new URL('../public/downloads/os-bridge.mjs.sha256', import.meta.url),
  `${digest}  os-bridge.mjs\n`,
)

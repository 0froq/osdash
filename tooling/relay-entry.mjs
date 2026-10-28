import { readFile, rename, writeFile } from 'node:fs/promises'

const directory = new URL('../.output/server/', import.meta.url)
const entry = new URL('index.mjs', directory)
const source = await readFile(entry, 'utf8')
if (!source.startsWith('// osdash account device relay'))
  await rename(entry, new URL('nitro.mjs', directory))
await writeFile(
  entry,
  `// osdash account device relay
import nitro from './nitro.mjs'
import { socketUpgrade } from './device-relay.mjs'
export * from './nitro.mjs'
export { DeviceRelay } from './device-relay.mjs'
export default {
  ...nitro,
  fetch(request, env, ctx) {
    return socketUpgrade(request, env) ?? nitro.fetch(request, env, ctx)
  },
}
`,
)

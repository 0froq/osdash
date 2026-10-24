import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { TOKENS, tokenVar } from '../src/core/contract'

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'tokens.css')
const css = readFileSync(file, 'utf8')
const problems: string[] = []
const allowed = new Set<string>(TOKENS.map(tokenVar))
const source = dirname(file)

function checkDirectory(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      checkDirectory(path)
      continue
    }
    if (!/\.(?:vue|css)$/.test(path) || path.endsWith('.demo.vue'))
      continue
    const content = readFileSync(path, 'utf8')
    const styles = path.endsWith('.css') ? content : [...content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n')
    // A name the file declares for itself (a private custom property) is not a token read.
    const declared = new Set([
      ...styles.matchAll(/(--[\w-]+)\s*:/g),
      ...styles.matchAll(/@property\s+(--[\w-]+)/g),
    ].map(match => match[1]!))
    for (const match of styles.matchAll(/var\(\s*(--[\w-]+)/g)) {
      if (!allowed.has(match[1]!) && !declared.has(match[1]!))
        problems.push(`${path.slice(source.length + 1)}: reads undeclared token ${match[1]}`)
    }
  }
}
checkDirectory(source)

if (!/\.ui\s*\{/.test(css))
  problems.push('tokens.css: no .ui scope')
for (const token of TOKENS) {
  if (!new RegExp(`${tokenVar(token)}\\s*:`).test(css))
    problems.push(`tokens.css: missing ${tokenVar(token)}`)
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exitCode = 1
}
else {
  process.stdout.write(`tokens.css defines all ${TOKENS.length} tokens; component styles only read the contract\n`)
}

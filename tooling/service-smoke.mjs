import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

if (process.platform !== 'darwin')
  throw new Error(
    'This native smoke requires a macOS GUI login. Linux service rendering is covered by unit tests.',
  )
const home = await mkdtemp(join(tmpdir(), 'osdash-service-smoke-'))
const root = join(home, 'work space & 中文')
await mkdir(root)
await mkdir(join(root, '.os'))
await writeFile(
  join(root, '.os/config.json'),
  JSON.stringify({ version: 1, origin: 'https://osdash.froq.me' }),
)
const program = resolve('public/downloads/os-bridge.mjs')
const env = { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, '.config') }
const label = `me.froq.osdash.${createHash('sha256').update(home).digest('hex').slice(0, 12)}`
const target = `gui/${process.getuid()}/${label}`
const reserve = createServer()
reserve.listen(0, '127.0.0.1')
await new Promise(resolve => reserve.once('listening', resolve))
const port = reserve.address().port
await new Promise(resolve => reserve.close(resolve))
const run = args =>
  execFileSync(process.execPath, [program, ...args], {
    env,
    encoding: 'utf8',
    timeout: 30_000,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
const serve = ['serve', '--root', root, '--name', 'Smoke Mini', '--port', String(port)]
try {
  const output = run(serve)
  assert.ok(output.includes('Pairing code (one use'))
  assert.ok(output.includes('You can close Terminal'))
  const state = JSON.parse(await readFile(join(home, '.local/state/osdash/service.json'), 'utf8'))
  assert.equal(state.root, await realpath(root))
  assert.equal(state.entry, program)
  assert.equal(state.node, process.execPath)
  const status = run(['status'])
  const pid = Number(status.match(/PID (\d+)/)?.[1])
  assert.ok(pid > 0)
  assert.equal(
    execFileSync('ps', ['-p', String(pid), '-o', 'ppid='], { encoding: 'utf8' }).trim(),
    '1',
  )
  assert.ok(run(serve).includes('already running'))
  assert.equal(Number(run(['status']).match(/PID (\d+)/)?.[1]), pid)
  const response = await fetch(`http://127.0.0.1:${port}/v1/status`, {
    headers: { Origin: 'https://osdash.froq.me' },
  })
  assert.equal(response.status, 200)
  assert.ok(run(['restart']).includes('Pairing code (one use'))
  assert.notEqual(Number(run(['status']).match(/PID (\d+)/)?.[1]), pid)
  assert.ok(run(['stop']).includes('Automatic startup disabled'))
  assert.ok(run(['status']).includes('stopped'))
  assert.equal(
    (await readFile(join(root, '.os/config.json'), 'utf8')).includes('https://osdash.froq.me'),
    true,
  )
  const configPath = join(home, '.config/osdash/config.json')
  await mkdir(join(home, '.config/osdash'), { recursive: true })
  await writeFile(configPath, JSON.stringify({ version: 1, notifyPollSeconds: 0 }))
  const configuredOutput = run(['serve', '--config', configPath, '--port', String(port)])
  assert.ok(configuredOutput.includes('Config: ' + configPath))
  assert.ok(configuredOutput.includes('New notes: ' + join(home, 'osdash/notes')))
  const configured = JSON.parse(
    await readFile(join(home, '.local/state/osdash/service.json'), 'utf8'),
  )
  assert.equal(configured.configured, true)
  assert.equal(configured.userConfigPath, configPath)
  assert.equal(configured.root, join(await realpath(home), 'osdash'))
  assert.ok((await stat(join(home, 'osdash/notes'))).isDirectory())
  assert.ok(run(['restart']).includes('Config: ' + configPath))
  assert.ok(run(['stop']).includes('Automatic startup disabled'))
  console.log(
    'Built CLI native service: detached parent, escaped paths, startup instructions, idempotence, status, restart, stop, preserved legacy workspace and configured global storage passed',
  )
} finally {
  try {
    execFileSync('launchctl', ['bootout', target], { stdio: 'ignore' })
  } catch {
    /* Already stopped. */
  }
  try {
    execFileSync('launchctl', ['enable', target], { stdio: 'ignore' })
  } catch {
    /* No lingering disabled override needed. */
  }
  await rm(home, { recursive: true, force: true })
}

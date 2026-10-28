import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { it } from 'vite-plus/test'
import {
  createServiceManager,
  serviceDefinition,
  servicePaths,
  type ServiceConfig,
} from './service'

const config: ServiceConfig = {
  version: 1,
  root: '/tmp/work space & <notes> $HOME %n',
  origin: 'https://osdash.froq.me',
  port: 47831,
  name: 'My "device" & notes',
  node: '/node path/node',
  entry: '/program path/bridge.mjs',
}

it('renders portable native service definitions with literal arguments and foreground recursion prevention', () => {
  const mac = serviceDefinition(config, servicePaths('/tmp/example home', 'darwin'))
  assert.ok(mac.includes('<string>--foreground</string>'))
  assert.ok(mac.includes('work space &amp; &lt;notes&gt;'))
  assert.ok(mac.includes('My &quot;device&quot; &amp; notes'))
  assert.ok(mac.includes('<key>KeepAlive</key><true/>'))
  const linux = serviceDefinition(config, servicePaths('/tmp/example home', 'linux'))
  assert.ok(linux.includes('"/node path/node" "/program path/bridge.mjs" "serve" "--foreground"'))
  assert.ok(linux.includes('$$HOME %%n'))
  assert.ok(linux.includes('WorkingDirectory="/tmp/work space & <notes> $HOME %%n"'))
  assert.ok(linux.includes('Restart=always'))
  assert.notEqual(
    servicePaths('/tmp/one', 'darwin').label,
    servicePaths('/tmp/two', 'darwin').label,
  )
  assert.throws(() => servicePaths('/tmp/home', 'win32'), /foreground/)
})

for (const platform of ['darwin', 'linux'] as const) {
  it(`manages ${platform} lifecycle without overwriting another workspace or deleting data`, async () => {
    const home = await mkdtemp(join(tmpdir(), 'osdash-service-'))
    const calls: string[][] = []
    let running = false
    const manager = createServiceManager({
      home,
      platform,
      run: async (command, args) => {
        calls.push([command, ...args])
        if (args.includes('print') || args.includes('show'))
          return platform === 'darwin'
            ? running
              ? '\tpid = 4242\n'
              : ''
            : `MainPID=${running ? 4242 : 0}\n`
        if (args.includes('bootstrap') || (args.includes('enable') && args.includes('--now')))
          running = true
        if (args.includes('bootout') || args.includes('disable')) running = false
        return ''
      },
    })
    try {
      assert.equal(await manager.saved(), null)
      await manager.stop()
      assert.equal(calls.length, 0)
      const first = await manager.start(config)
      assert.equal(first.fresh, true)
      assert.deepEqual(await manager.saved(), config)
      assert.equal((await stat(manager.paths.config)).mode & 0o777, 0o600)
      assert.equal((await stat(manager.paths.log)).mode & 0o777, 0o600)
      const before = calls.length
      assert.equal((await manager.start(config)).fresh, false)
      assert.ok(calls.slice(before).every(call => call.includes('show') || call.includes('print')))
      await assert.rejects(
        manager.start({ ...config, root: '/different/workspace' }),
        /Another workspace/,
      )
      assert.deepEqual(await manager.saved(), config)
      await writeFile(manager.paths.log, '旧日志\n')
      const restarted = await manager.start(config, true)
      assert.equal(restarted.fresh, true)
      await writeFile(
        manager.paths.log,
        'Bridge: fixture\nPairing code: fresh\nPaste the code only into the allowed website.\n',
        { flag: 'a' },
      )
      assert.ok(!(await manager.instructions(restarted.offset)).includes('旧日志'))
      await manager.stop()
      assert.equal((await manager.state()).running, false)
      assert.deepEqual(await manager.saved(), config)
    } finally {
      await rm(home, { recursive: true, force: true })
    }
  })
}

it('refuses unknown native definitions and symlinked private state', async () => {
  const home = await mkdtemp(join(tmpdir(), 'osdash-service-safety-'))
  const manager = createServiceManager({ home, platform: 'darwin', run: async () => '' })
  try {
    await mkdir(dirname(manager.paths.definition), { recursive: true })
    await writeFile(manager.paths.definition, 'Unmanaged user file')
    await assert.rejects(manager.start(config), /unmanaged/)
    assert.equal(await readFile(manager.paths.definition, 'utf8'), 'Unmanaged user file')
    await mkdir(manager.paths.directory, { recursive: true })
    const target = join(home, 'untouched.json')
    await writeFile(target, JSON.stringify(config), { mode: 0o600 })
    await symlink(target, manager.paths.config)
    await assert.rejects(manager.saved())
    assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), config)
  } finally {
    await rm(home, { recursive: true, force: true })
  }
})

it('reports a missing native manager instead of silently falling back to a terminal process', async () => {
  const manager = createServiceManager({
    home: '/tmp/service-home',
    platform: 'linux',
    run: async () => {
      throw Object.assign(new Error('missing'), { code: 'ENOENT' })
    },
  })
  await assert.rejects(manager.state(), /foreground/)
})

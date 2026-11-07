import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'vite-plus/test'
import { loadUserConfig } from './config'

it('selects exactly one config, ignores relative XDG and never falls back after invalid input', async () => {
  const home = await mkdtemp(join(tmpdir(), 'osdash-config-'))
  const put = async (path: string, value: string) => {
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, value)
  }
  try {
    const options = { home, env: { XDG_CONFIG_HOME: 'relative' } }
    assert.equal((await loadUserConfig(options)).config.workspaceDirectory, join(home, 'osdash'))
    assert.equal((await loadUserConfig(options)).path, null)
    await put(join(home, 'os/config.json'), JSON.stringify({ locale: 'en' }))
    await put(join(home, '.os/config.json'), JSON.stringify({ notesDirectory: '~/custom' }))
    let result = await loadUserConfig(options)
    assert.equal(result.config.locale, 'system')
    assert.equal(result.config.notesDirectory, join(home, 'custom'))
    await put(
      join(home, 'osdash/config.json'),
      JSON.stringify({ locale: 'en', notesDirectory: '~/visible' }),
    )
    result = await loadUserConfig(options)
    assert.equal(result.path, join(home, 'osdash/config.json'))
    await put(
      join(home, '.osdash/config.json'),
      JSON.stringify({ locale: 'zh-CN', notesDirectory: '~/hidden' }),
    )
    result = await loadUserConfig(options)
    assert.equal(result.path, join(home, '.osdash/config.json'))
    assert.equal(result.config.notesDirectory, join(home, 'hidden'))
    const xdg = join(home, 'xdg')
    await put(
      join(xdg, 'osdash/config.json'),
      JSON.stringify({ locale: 'zh-CN', repoDirectories: ['~/code/me/*'] }),
    )
    result = await loadUserConfig({ home, env: { XDG_CONFIG_HOME: xdg } })
    assert.equal(result.config.locale, 'zh-CN')
    assert.equal(result.config.notesDirectory, join(home, 'osdash/notes'))
    assert.deepEqual(result.config.repoDirectories, [
      { pattern: join(home, 'code/me/*'), writable: false },
    ])
    await put(join(xdg, 'osdash/config.json'), '{bad')
    await assert.rejects(loadUserConfig({ home, env: { XDG_CONFIG_HOME: xdg } }), /Invalid config/)
    await assert.rejects(loadUserConfig({ home, path: '~/missing.json' }), /Cannot read config/)
    assert.equal((await loadUserConfig({ home, path: '~/os/config.json' })).config.locale, 'en')
    await put(join(home, 'unsafe.json'), '{"notifyPollSeconds":1}')
    await assert.rejects(loadUserConfig({ home, path: '~/unsafe.json' }), /notifyPollSeconds/)
    await rm(join(home, 'unsafe.json'))
    await symlink(join(home, 'os/config.json'), join(home, 'unsafe.json'))
    await assert.rejects(loadUserConfig({ home, path: '~/unsafe.json' }))
  } finally {
    await rm(home, { recursive: true, force: true })
  }
})

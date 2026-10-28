import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'vite-plus/test'
import { openWorkspace, type LocalWorkspace } from './workspace'
import { LOCAL_BRIDGE_ORIGIN } from '../shared/local-bridge'

const account = { id: '123', login: 'octocat' }
const unit = 'pr:owner/repo#42'
const note = {
  id: 'a1234567-1234-4567-89ab-123456789abc',
  anchor: '2026-10-26T00:00:00.000Z',
  at: '2026-10-26T01:00:00.000Z',
  text: '# 私人笔记\n\n- [x] done\n---\nMore **Markdown**',
}
const segments = ['.os', 'users', account.id, 'notes', 'owner', 'repo', 'pr-42']
async function fixture(run: (root: string, workspace: LocalWorkspace) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'osdash-workspace-'))
  try {
    await run(root, await openWorkspace(root, LOCAL_BRIDGE_ORIGIN))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

it('creates only safe configuration and an inner gitignore, without overwriting either', async () => {
  await fixture(async (root, workspace) => {
    assert.deepEqual((await readdir(join(root, '.os'))).sort(), ['.gitignore', 'config.json'])
    assert.deepEqual(await workspace.readConfig(), { locale: 'system', notesConfigured: true })
    assert.equal(await readFile(join(root, '.os', '.gitignore'), 'utf8'), '*\n')
    const path = join(root, '.os', 'config.json')
    const source = JSON.stringify({
      version: 1,
      origin: LOCAL_BRIDGE_ORIGIN,
      locale: 'en',
      custom: 'preserved',
    })
    await writeFile(path, source)
    await openWorkspace(root, LOCAL_BRIDGE_ORIGIN)
    assert.equal(await readFile(path, 'utf8'), source)
    await assert.rejects(openWorkspace(root, 'https://other.example'), /origin differs/)
    assert.equal(await readFile(path, 'utf8'), source)
  })
})

it('round-trips one Markdown file per note and preserves creation time on edit and move', async () => {
  await fixture(async (root, workspace) => {
    assert.deepEqual(await workspace.list(account, unit), [])
    assert.deepEqual(await workspace.save(account, unit, note), note)
    const file = join(root, ...segments, `${note.id}.md`)
    const markdown = await readFile(file, 'utf8')
    assert.ok(markdown.startsWith('---\nid: '))
    assert.ok(markdown.endsWith(note.text))
    assert.ok(markdown.includes('repo: owner/repo'))
    assert.equal((await stat(file)).mode & 0o777, 0o600)
    assert.deepEqual(await workspace.list(account, unit), [note])
    const changed = { ...note, text: 'Changed', anchor: note.at, at: note.anchor }
    assert.deepEqual(await workspace.save(account, unit, changed), { ...changed, at: note.at })
    assert.deepEqual(await readdir(join(root, ...segments)), [`${note.id}.md`])
    await workspace.remove(account, unit, note.id)
    await workspace.remove(account, unit, note.id)
    assert.deepEqual(await workspace.list(account, unit), [])
  })
})

it('isolates accounts by numeric GitHub ID, not mutable login or supplied metadata', async () => {
  await fixture(async (_root, workspace) => {
    await workspace.save(account, unit, note)
    assert.deepEqual(await workspace.list({ id: '456', login: account.login }, unit), [])
    assert.deepEqual(await workspace.list({ ...account, login: 'renamed' }, unit), [note])
    assert.deepEqual(await workspace.list(account, 'issue:owner/repo#42'), [])
    await assert.rejects(workspace.list({ id: '../123', login: 'bad' }, unit))
  })
})

it('rejects traversal, malformed metadata, oversized input, symlink files and directories', async () => {
  await fixture(async (root, workspace) => {
    for (const id of [
      'pr:owner/../#42',
      'pr:owner/..#42',
      'pr:owner/repo#0',
      'pr:owner/repo#42/../secret',
    ]) {
      await assert.rejects(workspace.list(account, id))
    }
    await assert.rejects(workspace.save(account, unit, { ...note, id: '../secret' }))
    await assert.rejects(workspace.save(account, unit, { ...note, text: 'x'.repeat(65537) }))
    await workspace.save(account, unit, note)
    const file = join(root, ...segments, `${note.id}.md`)
    await writeFile(file, '---\nid: wrong\n---\nno')
    await assert.rejects(workspace.list(account, unit))
    await assert.rejects(workspace.save(account, unit, note))
    await rm(file)
    const outside = join(root, 'private.md')
    await writeFile(outside, 'must remain unchanged')
    await symlink(outside, file)
    await assert.rejects(workspace.list(account, unit))
    await assert.rejects(workspace.save(account, unit, note))
    await assert.rejects(workspace.remove(account, unit, note.id))
    assert.equal(await readFile(outside, 'utf8'), 'must remain unchanged')
    await rm(join(root, '.os', 'users'), { recursive: true })
    await symlink(root, join(root, '.os', 'users'))
    await assert.rejects(workspace.list(account, unit))
    await assert.rejects(workspace.save(account, unit, note))
  })
})

it('rejects symlink workspace roots and config files without touching their targets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'osdash-symlink-'))
  const outside = await mkdtemp(join(tmpdir(), 'osdash-outside-'))
  try {
    await symlink(outside, join(root, '.os'))
    await assert.rejects(openWorkspace(root, LOCAL_BRIDGE_ORIGIN))
    assert.deepEqual(await readdir(outside), [])
    await rm(join(root, '.os'))
    await openWorkspace(root, LOCAL_BRIDGE_ORIGIN)
    const config = join(root, '.os', 'config.json')
    await rm(config)
    await symlink(join(outside, 'config.json'), config)
    await writeFile(join(outside, 'config.json'), '{}')
    await assert.rejects(openWorkspace(root, LOCAL_BRIDGE_ORIGIN))
    assert.equal(await readFile(join(outside, 'config.json'), 'utf8'), '{}')
  } finally {
    await rm(root, { recursive: true, force: true })
    await rm(outside, { recursive: true, force: true })
  }
})

it('serializes rapid changes and never leaves partial or temporary notes', async () => {
  await fixture(async (root, workspace) => {
    await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        workspace.save(account, unit, { ...note, text: String(index) }),
      ),
    )
    assert.equal((await workspace.list(account, unit))[0]?.text, '11')
    assert.deepEqual(await readdir(join(root, ...segments)), [`${note.id}.md`])
  })
})

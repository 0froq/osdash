import { randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'vite-plus/test'
import { openConfiguredWorkspace } from './notes'
import { NoteConflict } from './workspace'
import { runDeviceCommand } from './device-client'
import { noteKey } from '../shared/device-relay'
import { LOCAL_BRIDGE_ORIGIN } from '../shared/local-bridge'

const account = { id: '123', login: 'octocat' }
const note = {
  id: 'a1234567-1234-4567-89ab-123456789abc',
  anchor: '2026-10-26T00:00:00.000Z',
  at: '2026-10-26T00:00:00.000Z',
  text: 'Global note',
}
const unit = 'pr:upstream/project#42'

it('indexes independent sources, isolates accounts, routes new writes globally and enforces readonly on the device', async () => {
  const home = await mkdtemp(join(tmpdir(), 'osdash-sources-'))
  const checkout = join(home, 'code/me/project')
  const notes = join(checkout, '.osdash/notes')
  const configPath = join(home, 'config.json')
  const config = { version: 1, workspaceDirectory: '~/osdash', repoDirectories: ['~/code/me/*'] }
  const putConfig = () => writeFile(configPath, JSON.stringify(config))
  try {
    await mkdir(notes, { recursive: true })
    const git = (...args: string[]) =>
      execFileSync('git', ['-C', checkout, ...args], { encoding: 'utf8' })
    git('init', '--quiet')
    git('remote', 'add', 'origin', 'https://github.com/me/project.git')
    git('remote', 'add', 'upstream', 'git@github.com:upstream/project.git')
    const file = join(notes, `${note.id}.md`)
    const content = `---\npr: 42\nanchor: ${note.anchor}\ncustom: keep\n---\nRepo note`
    await writeFile(file, content)
    await putConfig()
    const workspace = await openConfiguredWorkspace({ home, path: configPath })
    await workspace.rememberDevice({
      version: 1,
      origin: LOCAL_BRIDGE_ORIGIN,
      account,
      id: 'b1234567-1234-4567-89ab-123456789abc',
      secret: 's'.repeat(43),
      name: 'Test',
    })
    await workspace.saveVersioned(account, unit, note, null)
    let snapshot = await workspace.snapshot(account, unit)
    assert.equal(snapshot.notes.length, 2)
    const repoNote = snapshot.notes.find(row => row.source !== 'global')!
    assert.equal(repoNote.writable, false)
    assert.equal(snapshot.notes.find(row => row.source === 'global')?.text, note.text)
    assert.equal((await workspace.snapshot({ id: '456', login: 'someone' }, unit)).notes.length, 0)
    const version = snapshot.versions[noteKey(repoNote)]!
    const rejected = await runDeviceCommand(workspace, account, {
      action: 'save',
      unit,
      note: { ...repoNote, text: 'Forbidden', writable: true },
      version,
    })
    assert.equal(rejected.status, 400)
    assert.equal(
      (
        await runDeviceCommand(workspace, account, {
          action: 'delete',
          unit,
          noteId: note.id,
          source: repoNote.source,
          version,
        })
      ).status,
      400,
    )
    assert.equal(await readFile(file, 'utf8'), content)
    const catalog = await workspace.catalog(account)
    assert.equal(catalog.entries.length, 2)
    assert.equal(catalog.sources.find(source => source.kind === 'repo')?.repo, 'upstream/project')
    assert.equal(catalog.next, null)
    assert.equal(
      (await workspace.catalog(account, `${unit}:${noteKey(catalog.entries[0]!.note)}`)).entries
        .length,
      1,
    )
    // Changing a configured source's permission takes effect without moving files.
    await writeFile(
      configPath,
      JSON.stringify({ ...config, repoDirectories: [{ pattern: '~/code/me/*', writable: true }] }),
    )
    snapshot = await workspace.snapshot(account, unit)
    const writable = snapshot.notes.find(row => row.source === repoNote.source)!
    await workspace.saveVersioned(account, unit, { ...writable, text: 'Edited via Web' }, version)
    assert.match(await readFile(file, 'utf8'), /custom: keep/)
    assert.match(await readFile(file, 'utf8'), /Edited via Web/)
    await assert.rejects(workspace.saveVersioned(account, unit, writable, version), NoteConflict)
    const latest = await workspace.snapshot(account, unit)
    await workspace.remove(
      account,
      unit,
      note.id,
      latest.versions[noteKey(writable)],
      writable.source,
    )
    assert.equal((await workspace.snapshot(account, unit)).notes.length, 1)
    await writeFile(file, content)
    await symlink(join(home, 'config.json'), join(notes, 'private.md'))
    assert.ok(
      (await workspace.catalog(account)).warnings.some(warning => warning.includes('symlinks')),
    )
    assert.equal(git('status', '--porcelain').includes('.osdash/'), true)
    assert.equal(await readFile(file, 'utf8'), content)
  } finally {
    await rm(home, { recursive: true, force: true })
  }
})

it('keeps legacy credentials and notes in place while defaulting new notes to global', async () => {
  const home = await mkdtemp(join(tmpdir(), 'osdash-legacy-'))
  try {
    const { openWorkspace } = await import('./workspace')
    const legacyRoot = join(home, 'checkout')
    await mkdir(legacyRoot)
    const old = await openWorkspace(legacyRoot, LOCAL_BRIDGE_ORIGIN)
    await old.save(account, unit, note)
    const oldConfig = join(legacyRoot, '.os/config.json')
    await writeFile(oldConfig, '{not the selected config')
    const configPath = join(home, 'config.json')
    await writeFile(configPath, JSON.stringify({ version: 1 }))
    const workspace = await openConfiguredWorkspace({ home, path: configPath, root: legacyRoot })
    const oldNote = (await workspace.list(account, unit))[0]!
    assert.deepEqual(await workspace.readConfig(), { locale: 'system', notesConfigured: true })
    assert.equal(await readFile(oldConfig, 'utf8'), '{not the selected config')
    assert.match(oldNote.source!, /^legacy:/)
    await workspace.saveVersioned(
      account,
      unit,
      { ...note, id: 'b1234567-1234-4567-89ab-123456789abc' },
      null,
    )
    assert.equal((await workspace.list(account, unit)).length, 2)
    assert.equal((await old.list(account, unit)).length, 1)
    // A large catalog must survive the relay budget and resume from a stable cursor.
    for (let index = 0; index < 8; index++) {
      await workspace.saveVersioned(
        account,
        `issue:upstream/project#${100 + index}`,
        { ...note, id: randomUUID(), text: 'x'.repeat(60 * 1024) },
        null,
      )
    }
    let after: string | undefined
    const found = new Set<string>()
    let pages = 0
    do {
      const page = await workspace.catalog(account, after)
      assert.ok(Buffer.byteLength(JSON.stringify(page)) < 512 * 1024)
      for (const row of page.entries) {
        const key = `${row.unit}:${noteKey(row.note)}`
        assert.ok(!found.has(key))
        found.add(key)
      }
      after = page.next ?? undefined
      pages++
      assert.ok(pages < 10)
    } while (after)
    assert.equal(found.size, 10)
    assert.ok(pages > 1)
  } finally {
    await rm(home, { recursive: true, force: true })
  }
})

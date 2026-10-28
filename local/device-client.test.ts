import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat, symlink, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'vite-plus/test'
import { LOCAL_BRIDGE_ORIGIN } from '../shared/local-bridge'
import { runDeviceCommand } from './device-client'
import { openWorkspace } from './workspace'

it('detects external file changes and rejects stale saves/deletes without crossing accounts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'osdash-versioned-notes-'))
  try {
    const workspace = await openWorkspace(root, LOCAL_BRIDGE_ORIGIN)
    const account = { id: '123', login: 'alice' }
    const unit = 'pr:owner/repo#42'
    const note = {
      id: 'a1234567-1234-4567-89ab-123456789abc',
      text: 'Original note',
      anchor: new Date().toISOString(),
      at: new Date().toISOString(),
    }
    const first = await workspace.saveVersioned(account, unit, note, null)
    const path = join(root, '.os/users/123/notes/owner/repo/pr-42', `${note.id}.md`)
    const external = (await readFile(path, 'utf8')).replace(
      'Original note',
      'Edited outside osdash',
    )
    await writeFile(path, external)
    assert.equal(
      (
        await runDeviceCommand(workspace, account, {
          action: 'save',
          unit,
          note,
          version: first.version,
        })
      ).status,
      409,
    )
    assert.equal(
      (
        await runDeviceCommand(workspace, account, {
          action: 'delete',
          unit,
          noteId: note.id,
          version: first.version,
        })
      ).status,
      409,
    )
    assert.equal(await readFile(path, 'utf8'), external)
    assert.deepEqual((await workspace.snapshot({ id: '456', login: 'bob' }, unit)).notes, [])
    assert.equal(
      (await runDeviceCommand(workspace, account, { action: 'save', unit, note })).status,
      400,
    )
    const next = await workspace.snapshot(account, unit)
    assert.equal(next.notes[0]?.text, 'Edited outside osdash')
    assert.notEqual(next.versions[note.id], first.version)
    assert.equal(
      (
        await runDeviceCommand(workspace, account, {
          action: 'delete',
          unit,
          noteId: note.id,
          version: next.versions[note.id],
        })
      ).status,
      200,
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

it('persists a private device credential and refuses malformed or symlinked credential files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'osdash-device-credential-'))
  try {
    const workspace = await openWorkspace(root, LOCAL_BRIDGE_ORIGIN)
    const credential = {
      version: 1 as const,
      origin: LOCAL_BRIDGE_ORIGIN,
      account: { id: '123', login: 'alice' },
      id: 'a1234567-1234-4567-89ab-123456789abc',
      secret: 'x'.repeat(43),
      name: 'Mini',
    }
    const path = join(root, '.os/device.json')
    assert.equal(await workspace.readDevice(), null)
    await workspace.rememberDevice(credential)
    assert.deepEqual(await workspace.readDevice(), credential)
    assert.equal((await stat(path)).mode & 0o777, 0o600)
    await assert.rejects(
      workspace.rememberDevice({ ...credential, account: { id: '456', login: 'bob' } }),
      /another device identity/,
    )
    assert.deepEqual(await workspace.readDevice(), credential)
    await writeFile(path, '{')
    await assert.rejects(workspace.readDevice(), /Invalid device credential/)
    await assert.rejects(workspace.rememberDevice(credential))
    assert.equal(await readFile(path, 'utf8'), '{')
    await unlink(path)
    const outside = join(root, 'outside.json')
    await writeFile(outside, JSON.stringify(credential))
    await symlink(outside, path)
    await assert.rejects(
      workspace.readDevice(),
      (error: unknown) => (error as NodeJS.ErrnoException).code === 'ELOOP',
    )
    await assert.rejects(workspace.rememberDevice(credential))
    assert.equal(await readFile(outside, 'utf8'), JSON.stringify(credential))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

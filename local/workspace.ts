import { constants } from 'node:fs'
import { lstat, mkdir, open, readdir, realpath, rename, unlink } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { join, resolve } from 'node:path'
import { parse, stringify } from 'yaml'
import type { UnitNote } from '../shared/unit.ts'
import {
  isLocalAccount,
  isLocalNoteId,
  localUnitAddress,
  type LocalAccount,
} from '../shared/local-bridge.ts'
import { safeLocalConfig } from './bridge.ts'
import {
  validCredential,
  type DeviceCredential,
  type NoteSnapshot,
} from '../shared/device-relay.ts'

export class NoteConflict extends Error {}
const digest = (text: string) => createHash('sha256').update(text).digest('hex')
function checkVersion(source: string | null, expected: string | null | undefined) {
  if (expected !== undefined && (source === null ? null : digest(source)) !== expected) {
    throw new NoteConflict(
      'The note changed on the storage device. Reload before saving or deleting.',
    )
  }
}

const MAX_FILE = 128 * 1024

function missing(error: unknown) {
  return (error as NodeJS.ErrnoException).code === 'ENOENT'
}

async function directory(path: string, create: boolean): Promise<boolean> {
  try {
    const stat = await lstat(path)
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error('Workspace directory must not be a symlink')
    return true
  } catch (error) {
    if (!missing(error)) throw error
    if (!create) return false
    try {
      await mkdir(path, { mode: 0o700 })
    } catch (failure) {
      if ((failure as NodeJS.ErrnoException).code !== 'EEXIST') throw failure
    }
    return directory(path, false)
  }
}

async function readBounded(path: string): Promise<string | null> {
  let file
  try {
    file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  } catch (error) {
    if (missing(error)) return null
    throw error
  }
  try {
    if (!(await file.stat()).isFile()) throw new Error('Expected a regular file')
    const buffer = Buffer.alloc(MAX_FILE + 1)
    let size = 0
    while (size < buffer.length) {
      const result = await file.read(buffer, size, buffer.length - size, null)
      if (result.bytesRead === 0) break
      size += result.bytesRead
    }
    if (size > MAX_FILE) throw new Error('Workspace file is too large')
    return buffer.subarray(0, size).toString('utf8')
  } finally {
    await file.close()
  }
}

function validateNote(value: unknown): UnitNote {
  if (!value || typeof value !== 'object') throw new Error('Invalid note')
  const note = value as UnitNote
  if (
    typeof note.id !== 'string' ||
    !isLocalNoteId(note.id) ||
    typeof note.text !== 'string' ||
    Buffer.byteLength(note.text) > 64 * 1024 ||
    typeof note.anchor !== 'string' ||
    !Number.isFinite(Date.parse(note.anchor)) ||
    typeof note.at !== 'string' ||
    !Number.isFinite(Date.parse(note.at))
  ) {
    throw new Error('Invalid note')
  }
  return {
    id: note.id,
    text: note.text,
    anchor: new Date(note.anchor).toISOString(),
    at: new Date(note.at).toISOString(),
  }
}

function decode(source: string, unit: string, id: string): UnitNote {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(source)
  if (!match) throw new Error('Invalid note front matter')
  const meta = parse(match[1]!, { maxAliasCount: 0, uniqueKeys: true }) as Record<string, unknown>
  const address = localUnitAddress(unit)
  if (
    !meta ||
    meta.id !== id ||
    meta.repo !== `${address.owner}/${address.repo}` ||
    meta.kind !== address.kind ||
    meta.number !== address.number
  )
    throw new Error('Note metadata does not match its location')
  return validateNote({ id, text: match[2], anchor: meta.anchor, at: meta.createdAt })
}

async function atomicWrite(path: string, content: string) {
  const temporary = `${path}.${randomUUID()}.tmp`
  try {
    const file = await open(temporary, 'wx', 0o600)
    try {
      await file.writeFile(content)
      await file.sync()
    } finally {
      await file.close()
    }
    await rename(temporary, path)
  } finally {
    await unlink(temporary).catch(error => {
      if (!missing(error)) throw error
    })
  }
}

export async function openWorkspace(root: string, origin: string) {
  const workspaceRoot = await realpath(resolve(root))
  const home = join(workspaceRoot, '.os')
  await directory(home, true)
  const configPath = join(home, 'config.json')
  try {
    const file = await open(configPath, 'wx', 0o600)
    try {
      await file.writeFile(`${JSON.stringify({ version: 1, origin, locale: 'system' }, null, 2)}\n`)
    } finally {
      await file.close()
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
  }

  async function readConfig() {
    await directory(home, false)
    const source = await readBounded(configPath)
    if (source === null) throw new Error('Workspace configuration is missing')
    let config: { version?: number; origin?: string }
    try {
      config = JSON.parse(source)
      if (!config || typeof config !== 'object') throw new Error('Invalid config')
    } catch {
      throw new Error('Invalid workspace configuration JSON')
    }
    if (config.version !== 1 || config.origin !== origin) {
      throw new Error(
        'Workspace origin differs. Review .os/config.json before connecting another website.',
      )
    }
    return { ...safeLocalConfig(config), notesConfigured: true }
  }
  await readConfig()
  try {
    const ignore = await open(join(home, '.gitignore'), 'wx', 0o600)
    try {
      await ignore.writeFile('*\n')
    } finally {
      await ignore.close()
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
  }

  async function noteDirectory(account: LocalAccount, unit: string, create: boolean) {
    if (!isLocalAccount(account)) throw new Error('Verified GitHub identity required')
    const address = localUnitAddress(unit)
    let path = workspaceRoot
    for (const segment of [
      '.os',
      'users',
      account.id,
      'notes',
      address.owner,
      address.repo,
      `${address.kind}-${address.number}`,
    ]) {
      path = join(path, segment)
      if (!(await directory(path, create))) return null
    }
    return path
  }

  let writes = Promise.resolve()
  function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = writes.then(operation)
    writes = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }

  return {
    root: workspaceRoot,
    readConfig,
    async list(account: LocalAccount, unit: string): Promise<UnitNote[]> {
      return (await this.snapshot(account, unit)).notes
    },
    async snapshot(account: LocalAccount, unit: string): Promise<NoteSnapshot> {
      return serialize(async () => {
        const path = await noteDirectory(account, unit, false)
        if (!path) return { notes: [], versions: {} }
        const files = (await readdir(path)).filter(
          name => name.endsWith('.md') && isLocalNoteId(name.slice(0, -3)),
        )
        if (files.length > 2000) throw new Error('Too many notes to read in one request')
        const notes: UnitNote[] = []
        const versions: Record<string, string> = {}
        for (const file of files) {
          const source = await readBounded(join(path, file))
          if (source !== null) {
            const note = decode(source, unit, file.slice(0, -3))
            notes.push(note)
            versions[note.id] = digest(source)
          }
        }
        return {
          notes: notes.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)),
          versions,
        }
      })
    },
    async save(account: LocalAccount, unit: string, value: unknown): Promise<UnitNote> {
      return (await this.saveVersioned(account, unit, value)).note
    },
    saveVersioned(
      account: LocalAccount,
      unit: string,
      value: unknown,
      expected?: string | null,
    ): Promise<{ note: UnitNote; version: string }> {
      return serialize(async () => {
        const note = validateNote(value)
        const path = await noteDirectory(account, unit, true)
        if (!path) throw new Error('Cannot create note directory')
        const file = join(path, `${note.id}.md`)
        const previous = await readBounded(file)
        checkVersion(previous, expected)
        if (previous !== null) note.at = decode(previous, unit, note.id).at
        const address = localUnitAddress(unit)
        const meta = {
          id: note.id,
          repo: `${address.owner}/${address.repo}`,
          kind: address.kind,
          number: address.number,
          anchor: note.anchor,
          createdAt: note.at,
          updatedAt: new Date().toISOString(),
        }
        const source = `---\n${stringify(meta)}---\n${note.text}`
        await atomicWrite(file, source)
        return { note, version: digest(source) }
      })
    },
    remove(
      account: LocalAccount,
      unit: string,
      id: string,
      expected?: string | null,
    ): Promise<void> {
      return serialize(async () => {
        if (!isLocalNoteId(id)) throw new Error('Invalid note id')
        const path = await noteDirectory(account, unit, false)
        if (!path) return
        const file = join(path, `${id}.md`)
        const source = await readBounded(file)
        if (source === null) return
        checkVersion(source, expected)
        decode(source, unit, id)
        await unlink(file)
      })
    },
    async readDevice(): Promise<DeviceCredential | null> {
      await directory(home, false)
      const source = await readBounded(join(home, 'device.json'))
      if (source === null) return null
      let value: unknown
      try {
        value = JSON.parse(source)
      } catch {
        throw new Error('Invalid device credential file')
      }
      if (!validCredential(value, origin)) throw new Error('Invalid device credential file')
      return value
    },
    rememberDevice(value: DeviceCredential): Promise<void> {
      return serialize(async () => {
        await directory(home, false)
        if (!validCredential(value, origin)) throw new Error('Invalid device credential')
        const previous = await this.readDevice()
        if (
          previous &&
          (previous.account.id !== value.account.id ||
            previous.id !== value.id ||
            previous.secret !== value.secret)
        ) {
          throw new Error(
            'Workspace already belongs to another device identity. Use another workspace.',
          )
        }
        await atomicWrite(join(home, 'device.json'), `${JSON.stringify(value, null, 2)}\n`)
      })
    },
  }
}

export type LocalWorkspace = Awaited<ReturnType<typeof openWorkspace>>

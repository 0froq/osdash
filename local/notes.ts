import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { glob, lstat, mkdir, readdir, realpath, unlink } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'
import { promisify } from 'node:util'
import { parse, stringify } from 'yaml'
import {
  isLocalAccount,
  isLocalNoteId,
  localUnitAddress,
  type LocalAccount,
} from '../shared/local-bridge.ts'
import {
  noteKey,
  MAX_RELAY_BYTES,
  type CatalogNote,
  type NoteCatalog,
  type NoteSource,
  type NoteSnapshot,
} from '../shared/device-relay.ts'
import type { UnitNote } from '../shared/unit.ts'
import { loadUserConfig, type ConfigOptions } from './config.ts'
import {
  atomicWrite,
  NoteConflict,
  checkVersion,
  directory,
  openWorkspace,
  readBounded,
  validateNote,
  type LocalWorkspace,
} from './workspace.ts'

const execute = promisify(execFile)
const hash = (text: string) => createHash('sha256').update(text).digest('hex')
type Source = NoteSource & { path: string; storage?: LocalWorkspace }
type FileNote = CatalogNote & { path: string; metadata: Record<string, unknown> }

function remoteRepo(url: string) {
  const match =
    /^(?:https?:\/\/github\.com\/|ssh:\/\/git@github\.com\/|git@github\.com:)([A-Za-z0-9-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?\/?$/.exec(
      url.trim(),
    )
  if (!match)
    throw new Error(
      'Git remote must identify a GitHub repository. Set a repo override for this checkout.',
    )
  localUnitAddress(`pr:${match[1]}#1`)
  return match[1]!
}
async function repository(checkout: string) {
  const git = async (args: string[]) =>
    (
      await execute('git', ['-C', checkout, ...args], { timeout: 5000, maxBuffer: 16 * 1024 })
    ).stdout.trim()
  if ((await realpath(await git(['rev-parse', '--show-toplevel']))) !== checkout)
    throw new Error('Pattern must select a checkout root')
  for (const remote of ['upstream', 'origin']) {
    let urls: string
    try {
      urls = await git(['config', '--local', '--get-all', `remote.${remote}.url`])
    } catch (error) {
      if ((error as { code?: number }).code === 1) continue
      throw error
    }
    const repos = [...new Set(urls.split('\n').map(remoteRepo))]
    if (repos.length !== 1) throw new Error(`Ambiguous ${remote} remote. Set a repo override.`)
    return repos[0]!
  }
  throw new Error('No upstream or origin remote. Set a repo override.')
}
function frontmatter(source: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(source)
  if (!match) throw new Error('Expected YAML frontmatter')
  const metadata: unknown = parse(match[1]!, { maxAliasCount: 0, uniqueKeys: true })
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))
    throw new Error('Invalid frontmatter')
  return { metadata: metadata as Record<string, unknown>, text: match[2]! }
}
function decodeRepo(source: Source, path: string, content: string, modified: Date): FileNote {
  const { metadata, text } = frontmatter(content)
  const id = metadata.id ?? basename(path, '.md')
  const kind = metadata.pr !== undefined ? 'pr' : 'issue'
  if ((metadata.pr === undefined) === (metadata.issue === undefined))
    throw new Error('Provide exactly one pr or issue number')
  const number = metadata[kind]
  if (typeof number !== 'number' || !Number.isSafeInteger(number))
    throw new Error('Invalid contribution number')
  const unit = `${kind}:${source.repo}#${number}`
  localUnitAddress(unit)
  if (
    metadata.repo !== undefined &&
    String(metadata.repo).toLowerCase() !== source.repo!.toLowerCase()
  )
    throw new Error('Frontmatter repo differs from the configured repository')
  const note = validateNote({
    id,
    text,
    anchor: metadata.anchor,
    at: metadata.createdAt ?? metadata.anchor,
  })
  return {
    unit,
    path,
    metadata,
    version: hash(content),
    note: {
      ...note,
      source: source.id,
      writable: source.writable,
      updatedAt:
        typeof metadata.updatedAt === 'string' && Number.isFinite(Date.parse(metadata.updatedAt))
          ? metadata.updatedAt
          : modified.toISOString(),
    },
  }
}

/** Read configured sources, but route new notes exclusively to global storage. */
export async function openConfiguredWorkspace(
  options: ConfigOptions & { root?: string; origin?: string } = {},
): Promise<LocalWorkspace> {
  const selected = await loadUserConfig(options)
  const initial = selected.config
  const origin = options.origin ?? initial.origin
  if (options.origin && selected.path && options.origin !== initial.origin)
    throw new Error('CLI origin differs from the selected config')
  const settings = async () => {
    const { config } = await loadUserConfig({
      ...options,
      ...(selected.path ? { path: selected.path } : {}),
    })
    if (
      config.workspaceDirectory !== initial.workspaceDirectory ||
      config.deviceDirectory !== initial.deviceDirectory ||
      config.notesDirectory !== initial.notesDirectory ||
      config.origin !== initial.origin
    )
      throw new Error('Storage paths or origin changed. Restart the service to apply them.')
    return config
  }
  await mkdir(initial.workspaceDirectory, { recursive: true, mode: 0o700 })
  await directory(initial.workspaceDirectory, false)
  await mkdir(initial.notesDirectory, { recursive: true, mode: 0o700 })
  await directory(initial.notesDirectory, false)
  const global = await openWorkspace(initial.workspaceDirectory, origin, {
    notesRoot: initial.notesDirectory,
    readConfig: async () => ({ locale: (await settings()).locale, notesConfigured: true }),
  })
  // Explicit legacy --root retains its credential and old notes in place.
  const legacy = options.root
    ? await openWorkspace(options.root, origin, {
        notesRoot: initial.notesDirectory,
        legacy: true,
        readConfig: global.readConfig,
      })
    : null
  let credential = legacy ?? global
  if (initial.deviceDirectory !== initial.workspaceDirectory) {
    await mkdir(initial.deviceDirectory, { recursive: true, mode: 0o700 })
    await directory(initial.deviceDirectory, false)
    credential = await openWorkspace(initial.deviceDirectory, origin, {
      notesRoot: initial.notesDirectory,
      readConfig: global.readConfig,
    })
  }
  async function sources(account: LocalAccount) {
    if (!isLocalAccount(account)) throw new Error('Verified GitHub identity required')
    const result: Source[] = [
      {
        id: 'global',
        label: initial.notesDirectory,
        kind: 'global',
        writable: true,
        path: initial.notesDirectory,
        storage: global,
      },
    ]
    if (legacy)
      result.push({
        id: `legacy:${hash(legacy.root).slice(0, 16)}`,
        label: join(legacy.root, '.os'),
        kind: 'legacy',
        writable: true,
        path: join(legacy.root, '.os'),
        storage: legacy,
      })
    const warnings: string[] = []
    const config = await settings()
    // Repository notes have no account metadata. Only the device's bound identity may read them.
    if ((await credential.readDevice())?.account.id !== account.id) return { result, warnings }
    const seen = new Set<string>()
    let count = 0
    for (const entry of config.repoDirectories) {
      for await (const candidate of glob(entry.pattern, {
        exclude: ['**/node_modules/**', '**/.git/**'],
      })) {
        if (++count > 1000) throw new Error('Repository patterns match more than 1000 directories')
        try {
          if (!(await lstat(candidate)).isDirectory()) continue
          const checkout = await realpath(candidate)
          if (seen.has(checkout)) continue
          seen.add(checkout)
          const repo = entry.repo ?? (await repository(checkout))
          const path = join(checkout, '.osdash', 'notes')
          if (
            !(await directory(join(checkout, '.osdash'), false)) ||
            !(await directory(path, false))
          )
            continue
          result.push({
            id: `repo:${hash(checkout).slice(0, 16)}`,
            label: path,
            kind: 'repo',
            repo,
            writable: entry.writable,
            path,
          })
        } catch (error) {
          warnings.push(`${candidate}: ${(error as Error).message}`)
        }
      }
    }
    return { result, warnings }
  }
  async function repoFiles(source: Source) {
    const rows: FileNote[] = []
    const warnings: string[] = []
    let visited = 0
    async function walk(path: string, depth: number) {
      if (depth > 10) throw new Error('Notes directory nesting exceeds 10 levels')
      await directory(path, false)
      for (const entry of await readdir(path, { withFileTypes: true })) {
        if (++visited > 10000) throw new Error('More than 10000 files in repository notes')
        const file = join(path, entry.name)
        if (entry.isSymbolicLink()) {
          warnings.push(`${file}: symlinks are not read`)
          continue
        }
        if (entry.isDirectory()) await walk(file, depth + 1)
        else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const text = await readBounded(file)
            if (text !== null) rows.push(decodeRepo(source, file, text, (await lstat(file)).mtime))
          } catch (error) {
            warnings.push(`${file}: ${(error as Error).message}`)
          }
        }
      }
    }
    await walk(source.path, 0)
    return { rows, warnings }
  }
  async function collect(account: LocalAccount, unit?: string) {
    const { result, warnings } = await sources(account)
    const entries: CatalogNote[] = []
    for (const source of result) {
      if (source.storage) {
        const rows = unit ? await source.storage.snapshot(account, unit) : null
        const all = rows
          ? rows.notes.map(note => ({ unit: unit!, note, version: rows.versions[note.id]! }))
          : await source.storage.allNotes(account)
        entries.push(
          ...all.map(row => ({
            ...row,
            note: { ...row.note, source: source.id, writable: source.writable },
          })),
        )
      } else {
        const files = await repoFiles(source)
        warnings.push(...files.warnings)
        const keys = new Set<string>()
        for (const row of files.rows) {
          if (keys.has(row.note.id)) throw new Error(`Duplicate note ID in ${source.label}`)
          keys.add(row.note.id)
          if (!unit || row.unit.toLowerCase() === unit.toLowerCase()) entries.push(row)
        }
      }
    }
    return {
      entries,
      sources: result.map(({ path: _path, storage: _storage, ...source }) => source),
      warnings,
    }
  }
  let writes = Promise.resolve()
  const serialize = <T>(operation: () => Promise<T>) => {
    const result = writes.then(operation)
    writes = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }
  async function mutationSource(
    account: LocalAccount,
    unit: string,
    noteId: string,
    id: string | undefined,
    version: string | null | undefined,
  ) {
    if (!id && typeof version === 'string') {
      const rows = (await collect(account, unit)).entries.filter(row => row.note.id === noteId)
      const matching = rows.filter(row => row.version === version)
      if (rows.length === 1) id = rows[0]!.note.source
      else if (matching.length === 1) id = matching[0]!.note.source
      else if (rows.length > 1)
        throw new NoteConflict('Ambiguous note source. Reload with a current client.')
    }
    const source = (await sources(account)).result.find(source => source.id === (id ?? 'global'))
    if (!source) throw new Error('Unknown or unavailable note source')
    if (!source.writable) throw new Error('This note source is read-only')
    return source
  }
  const workspace: LocalWorkspace = {
    ...credential,
    root: legacy?.root ?? global.root,
    readConfig: global.readConfig,
    async allNotes(account) {
      return (await collect(account)).entries
    },
    async catalog(account, after = ''): Promise<NoteCatalog> {
      const catalog = await collect(account)
      const key = (row: CatalogNote) => `${row.unit}:${noteKey(row.note)}`
      const sorted = catalog.entries
        .sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0))
        .filter(row => key(row) > after)
      const entries: CatalogNote[] = []
      const warnings = catalog.warnings.slice(0, 100).map(message => message.slice(0, 1024))
      let size = Buffer.byteLength(JSON.stringify({ sources: catalog.sources, warnings })) + 2048
      if (size > 128 * 1024) throw new Error('Too much source metadata for one catalog response')
      for (const row of sorted) {
        const clean = { unit: row.unit, note: row.note, version: row.version }
        const bytes = Buffer.byteLength(JSON.stringify(clean))
        if (
          entries.length &&
          (size + bytes > Math.min(384 * 1024, MAX_RELAY_BYTES - 2048) || entries.length >= 50)
        )
          break
        if (size + bytes > MAX_RELAY_BYTES - 2048)
          throw new Error('Note is too large for the relay response')
        entries.push(clean)
        size += bytes
      }
      return {
        entries,
        sources: catalog.sources,
        warnings,
        next: sorted.length > entries.length ? key(entries.at(-1)!) : null,
      }
    },
    async snapshot(account, unit): Promise<NoteSnapshot> {
      localUnitAddress(unit)
      const { entries } = await collect(account, unit)
      const versions = Object.fromEntries(entries.map(row => [noteKey(row.note), row.version]))
      // Older Web releases address versions by UUID and omit source on mutations.
      for (const row of entries) {
        if (entries.filter(other => other.note.id === row.note.id).length === 1)
          versions[row.note.id] = row.version
      }
      return { notes: entries.map(row => row.note), versions }
    },
    async list(account, unit) {
      return (await this.snapshot(account, unit)).notes
    },
    async save(account, unit, value) {
      return (await this.saveVersioned(account, unit, value)).note
    },
    saveVersioned(account, unit, value, expected) {
      return serialize(async () => {
        localUnitAddress(unit)
        const input = value as UnitNote
        const note = validateNote(value)
        const source = await mutationSource(account, unit, note.id, input.source, expected)
        if (source.storage) {
          const result = await source.storage.saveVersioned(account, unit, note, expected)
          return { ...result, note: { ...result.note, source: source.id, writable: true } }
        }
        // Repository sources only edit existing files. New notes always go to global storage.
        const matches = (await repoFiles(source)).rows.filter(row => row.note.id === note.id)
        if (matches.length !== 1 || matches[0]!.unit.toLowerCase() !== unit.toLowerCase())
          throw new Error('Repository note not found or ambiguous')
        const previous = matches[0]!
        const content = await readBounded(previous.path)
        checkVersion(content, expected)
        if (content === null) throw new Error('Repository note was removed')
        const updatedAt = new Date().toISOString()
        const text = `---\n${stringify({ ...previous.metadata, anchor: note.anchor, createdAt: previous.note.at, updatedAt })}---\n${note.text}`
        await directory(source.path, false)
        const nested = relative(source.path, previous.path).split('/').slice(0, -1)
        let parent = source.path
        for (const part of nested) {
          parent = join(parent, part)
          await directory(parent, false)
        }
        await atomicWrite(previous.path, text)
        return {
          note: { ...note, at: previous.note.at, source: source.id, writable: true, updatedAt },
          version: hash(text),
        }
      })
    },
    remove(account, unit, id, expected, sourceId) {
      return serialize(async () => {
        localUnitAddress(unit)
        if (!isLocalNoteId(id)) throw new Error('Invalid note ID')
        const source = await mutationSource(account, unit, id, sourceId, expected)
        if (source.storage) return source.storage.remove(account, unit, id, expected)
        const matches = (await repoFiles(source)).rows.filter(row => row.note.id === id)
        if (matches.length === 0) return
        if (matches.length !== 1 || matches[0]!.unit.toLowerCase() !== unit.toLowerCase())
          throw new Error('Repository note not found or ambiguous')
        const previous = matches[0]!
        checkVersion(await readBounded(previous.path), expected)
        await unlink(previous.path)
      })
    },
  }
  return workspace
}

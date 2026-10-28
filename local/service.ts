import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { chmod, lstat, mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join } from 'node:path'
import { promisify } from 'node:util'

export type ServiceConfig = {
  version: 1
  root: string
  origin: string
  port: number
  name: string
  node: string
  entry: string
}
const execute = promisify(execFile)
const marker = 'Managed by os-'
const xml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
const unitValue = (value: string) => JSON.stringify(value.replaceAll('%', '%%'))
const unitArg = (value: string) => unitValue(value.replaceAll('$', () => '$$'))

export function servicePaths(home = homedir(), platform = process.platform) {
  if (platform !== 'darwin' && platform !== 'linux')
    throw new Error(
      'Background services require macOS launchd or Linux systemd. Use serve --foreground on this platform.',
    )
  const label = `me.froq.osdash.${createHash('sha256').update(home).digest('hex').slice(0, 12)}`
  const directory = join(home, '.local/state/os')
  return {
    platform,
    label,
    directory,
    config: join(directory, 'service.json'),
    log: join(directory, 'service.log'),
    errorLog: join(directory, 'service-error.log'),
    definition:
      platform === 'darwin'
        ? join(home, 'Library/LaunchAgents', `${label}.plist`)
        : join(home, '.config/systemd/user', `${label}.service`),
  }
}

export function serviceDefinition(
  config: ServiceConfig,
  paths: ReturnType<typeof servicePaths>,
): string {
  const args = [
    config.node,
    config.entry,
    'serve',
    '--foreground',
    '--root',
    config.root,
    '--origin',
    config.origin,
    '--port',
    String(config.port),
    '--name',
    config.name,
  ]
  if (paths.platform === 'darwin')
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<!-- ${marker} -->
<key>Label</key><string>${paths.label}</string>
<key>ProgramArguments</key><array>${args.map(value => `<string>${xml(value)}</string>`).join('')}</array>
<key>WorkingDirectory</key><string>${xml(config.root)}</string>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>10</integer><key>Umask</key><integer>63</integer>
<key>StandardOutPath</key><string>${xml(paths.log)}</string>
<key>StandardErrorPath</key><string>${xml(paths.errorLog)}</string>
</dict></plist>
`
  return `# ${marker}
[Unit]
Description=osdash storage device
[Service]
ExecStart=${args.map(unitArg).join(' ')}
WorkingDirectory=${unitValue(config.root)}
Restart=always
RestartSec=10
UMask=0077
StandardOutput=${unitValue(`append:${paths.log}`)}
StandardError=${unitValue(`append:${paths.errorLog}`)}
[Install]
WantedBy=default.target
`
}

async function privateWrite(path: string, content: string) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  try {
    const previous = await lstat(path)
    if (!previous.isFile() || previous.isSymbolicLink())
      throw new Error(`Unsafe service file: ${path}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  const temporary = `${path}.${process.pid}.tmp`
  try {
    await writeFile(temporary, content, { flag: 'wx', mode: 0o600 })
    await rename(temporary, path)
  } finally {
    await rm(temporary, { force: true })
  }
}

export function createServiceManager(
  options: {
    home?: string
    platform?: NodeJS.Platform
    run?: (command: string, args: string[]) => Promise<string>
  } = {},
) {
  const paths = servicePaths(options.home, options.platform)
  const domain = `gui/${process.getuid?.()}`
  const run =
    options.run ??
    (async (command: string, args: string[]) =>
      (await execute(command, args, { timeout: 15_000, maxBuffer: 128 * 1024 })).stdout)
  const native = (mac: string[], linux: string[]) =>
    paths.platform === 'darwin' ? run('launchctl', mac) : run('systemctl', ['--user', ...linux])
  async function saved(): Promise<ServiceConfig | null> {
    let file
    try {
      file = await open(paths.config, constants.O_RDONLY | constants.O_NOFOLLOW)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
    try {
      const stat = await file.stat()
      if (
        !stat.isFile() ||
        stat.size > 8192 ||
        (stat.mode & 0o077) !== 0 ||
        (process.getuid && stat.uid !== process.getuid())
      )
        throw new Error('Unsafe service configuration permissions')
      const value = JSON.parse(await file.readFile('utf8')) as ServiceConfig
      if (
        value.version !== 1 ||
        ![value.root, value.node, value.entry].every(
          item => typeof item === 'string' && isAbsolute(item),
        ) ||
        typeof value.origin !== 'string' ||
        !Number.isInteger(value.port) ||
        value.port < 1024 ||
        value.port > 65535 ||
        typeof value.name !== 'string'
      )
        throw new Error('Invalid saved service configuration')
      return value
    } finally {
      await file.close()
    }
  }
  async function state(): Promise<{ running: boolean; pid?: number }> {
    let output
    try {
      output = await native(
        ['print', `${domain}/${paths.label}`],
        ['show', `${paths.label}.service`, '--property=MainPID', '--property=ActiveState'],
      )
    } catch (error) {
      const failure = error as NodeJS.ErrnoException & { stderr?: string }
      if (failure.code === 'ENOENT')
        throw new Error('Native service manager not found. Use serve --foreground instead.')
      if (
        paths.platform === 'linux' &&
        /Failed to connect|Failed to get|No medium|No such file/i.test(failure.stderr ?? '')
      )
        throw new Error('A systemd user session is required. Use serve --foreground instead.')
      return { running: false }
    }
    const pid = Number(
      output.match(paths.platform === 'darwin' ? /^\s*pid = (\d+)/m : /^MainPID=(\d+)/m)?.[1],
    )
    return { running: pid > 0, ...(pid > 0 ? { pid } : {}) }
  }
  async function stop() {
    if (!(await saved())) return
    if (paths.platform === 'darwin') {
      await native(['disable', `${domain}/${paths.label}`], [])
      try {
        await native(['bootout', `${domain}/${paths.label}`], [])
      } catch {
        if ((await state()).running) throw new Error('Could not stop the storage service')
      }
    } else await native([], ['disable', '--now', `${paths.label}.service`])
  }
  async function start(config: ServiceConfig, restart = false) {
    const previous = await saved()
    const current = await state()
    if (
      current.running &&
      (!previous ||
        ['root', 'origin', 'port', 'name'].some(
          key => previous[key as keyof ServiceConfig] !== config[key as keyof ServiceConfig],
        ))
    )
      throw new Error(
        'Another workspace is already running. Use os- stop before changing service configuration.',
      )
    if (current.running && !restart) return { fresh: false as const, offset: 0, ...current }
    if (previous) await stop()
    try {
      const definition = await readFile(paths.definition, 'utf8')
      if (!definition.includes(marker))
        throw new Error('Refusing to replace an unmanaged service definition')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    await privateWrite(paths.config, JSON.stringify(config, null, 2) + '\n')
    await privateWrite(paths.definition, serviceDefinition(config, paths))
    await mkdir(paths.directory, { recursive: true, mode: 0o700 })
    for (const path of [paths.log, paths.errorLog]) {
      const file = await open(
        path,
        constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | constants.O_NOFOLLOW,
        0o600,
      )
      await file.close()
      await chmod(path, 0o600)
    }
    const offset = (await lstat(paths.log)).size
    if (paths.platform === 'darwin') {
      await native(['enable', `${domain}/${paths.label}`], [])
      await native(['bootstrap', domain, paths.definition], [])
    } else {
      await native([], ['daemon-reload'])
      await native([], ['enable', '--now', `${paths.label}.service`])
    }
    return { fresh: true as const, offset }
  }
  async function instructions(offset: number): Promise<string> {
    for (let i = 0; i < 150; i++) {
      const file = await open(paths.log, constants.O_RDONLY | constants.O_NOFOLLOW)
      let text
      try {
        const bytes = Buffer.alloc(16 * 1024)
        const { bytesRead } = await file.read(bytes, 0, bytes.length, offset)
        text = bytes.toString('utf8', 0, bytesRead)
      } finally {
        await file.close()
      }
      const ready = 'Paste the code only into the allowed website.'
      const end = text.indexOf(ready)
      if (end >= 0) return text.slice(0, end + ready.length)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    await stop()
    throw new Error(
      `Background service did not become ready. Check ${paths.errorLog}. An existing foreground process may be using the port.`,
    )
  }
  return { paths, saved, state, start, stop, instructions }
}

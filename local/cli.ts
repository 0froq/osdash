import { isAbsolute, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'
import { createServiceManager, type ServiceConfig } from './service.ts'

import { createLocalBridge, validateBridgeOrigin } from './bridge.ts'
import { openConfiguredWorkspace } from './notes.ts'
import { loadUserConfig, homePath } from './config.ts'
import { homedir } from 'node:os'
import { verifyRemoteAccount } from './account.ts'
import { createDeviceClient } from './device-client.ts'
import { startNotificationPolling } from './notifications.ts'

async function reportService(
  manager: ReturnType<typeof createServiceManager>,
  config: ServiceConfig,
  restart = false,
) {
  const result = await manager.start(config, restart)
  if (result.fresh) process.stdout.write(`${await manager.instructions(result.offset)}\n`)
  else
    process.stdout.write(
      `Storage service is already running (PID ${result.pid}).\nWorkspace: ${config.root}\n`,
    )
  const profileFlag = config.profile ? ` --profile ${config.profile}` : ''
  process.stdout.write(
    `Runs in the background. You can close Terminal.\nUse os- status${profileFlag}, os- restart${profileFlag} (fresh pairing code), or os- stop${profileFlag}.\nLogs: ${manager.paths.log}\n`,
  )
}

async function main() {
  const [major = 0, minor = 0] = process.versions.node.split('.').map(Number)
  if (!((major === 24 && minor >= 21) || major >= 26))
    throw new Error('os- requires Node 24.21.0 or newer supported LTS (26+).')
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      origin: { type: 'string' },
      config: { type: 'string' },
      profile: { type: 'string', default: 'default' },
      port: { type: 'string' },
      root: { type: 'string' },
      name: { type: 'string', default: 'My storage device' },
      help: { type: 'boolean' },
      foreground: { type: 'boolean' },
    },
  })
  if (values.help) {
    process.stdout.write(
      'Usage: os- serve [--profile <name>] [--config <file>] [--root <legacy workspace>] [--name <device name>] [--origin <origin>] [--port <port>] [--foreground]\n       os- status | stop | restart [--profile <name>]\n\nserve installs and starts a per-user background service on macOS/Linux.\n--foreground keeps this process attached to the terminal without installing a service.\n',
    )
    return
  }
  if (positionals.length !== 1 || !['serve', 'status', 'stop', 'restart'].includes(positionals[0]!))
    throw new Error('Expected serve, status, stop or restart. Use --help for usage.')
  const manager = createServiceManager({ profile: values.profile })
  if (positionals[0] !== 'serve') {
    const config = await manager.saved()
    if (!config) {
      process.stdout.write('No background service is installed. Run os- serve first.\n')
      return
    }
    if (positionals[0] === 'stop') {
      await manager.stop()
      process.stdout.write(
        'Storage service stopped. Automatic startup disabled. Files and binding kept.\n',
      )
    } else if (positionals[0] === 'restart')
      await reportService(
        manager,
        { ...config, node: process.execPath, entry: fileURLToPath(import.meta.url) },
        true,
      )
    else {
      const status = await manager.state()
      process.stdout.write(
        `Storage service: ${status.running ? `running (PID ${status.pid})` : 'stopped'}\nWorkspace: ${config.root}\nLogs: ${manager.paths.log}\n`,
      )
    }
    return
  }
  const port = Number(values.port ?? (values.profile === 'local' ? '47832' : '47831'))
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid bridge port')
  // Validate the origin before creating workspace files.
  const cliPath = (path: string) =>
    path.startsWith('~') ? homePath(path, homedir()) : resolve(path)
  const configHome =
    process.env.XDG_CONFIG_HOME && isAbsolute(process.env.XDG_CONFIG_HOME)
      ? process.env.XDG_CONFIG_HOME
      : join(homedir(), '.config')
  const configPath = values.config
    ? cliPath(values.config)
    : values.profile !== 'default'
      ? join(configHome, 'osdash/profiles', `${values.profile}.json`)
      : undefined
  const selected = await loadUserConfig({ path: configPath })
  const origin = values.origin ?? selected.config.origin
  validateBridgeOrigin(origin)
  if (!values.name.trim() || values.name.length > 64)
    throw new Error('Device name must be 1–64 characters')
  const workspace = await openConfiguredWorkspace({
    path: configPath,
    root: values.root ? cliPath(values.root) : undefined,
    origin,
  })
  if (!values.foreground) {
    await reportService(manager, {
      version: 1,
      ...(values.profile === 'default' ? {} : { profile: values.profile }),
      root: workspace.root,
      origin,
      configured: !values.root,
      userConfigPath: selected.path ?? undefined,
      port,
      name: values.name,
      node: process.execPath,
      entry: fileURLToPath(import.meta.url),
      environmentPath: process.env.PATH,
    })
    return
  }
  const device = createDeviceClient(workspace, origin, values.name, message =>
    process.stdout.write(`${message}\n`),
  )
  const bridge = createLocalBridge({
    origin,
    readConfig: workspace.readConfig,
    workspace,
    verifyAccount: (grant, challenge) => verifyRemoteAccount(origin, grant, challenge),
    onPair: (account, grant, challenge) => device.bind(account, grant, challenge),
  })
  await new Promise<void>((resolve, reject) => {
    bridge.server.once('error', reject)
    bridge.server.listen(port, '127.0.0.1', resolve)
  })
  await device.start()
  const stopNotifications = startNotificationPolling(
    workspace,
    async () => (await loadUserConfig({ path: selected.path ?? configPath })).config,
    message => process.stdout.write(`${message}\n`),
  )
  process.stdout.write(
    [
      `Bridge: http://127.0.0.1:${port}`,
      `Workspace: ${workspace.root}`,
      `Allowed website: ${origin}`,
      `Config: ${selected.path ?? '(built-in defaults)'}`,
      `New notes: ${selected.config.notesDirectory}`,
      'Storage: account-linked Markdown files. Bound workspaces reconnect automatically.',
      `Pairing code (one use, expires in 5 minutes): ${bridge.pairingCode}`,
      'Paste the code only into the allowed website. Restart this command to pair again.',
      '',
    ].join('\n'),
  )
  const stop = () => {
    stopNotifications()
    device.stop()
    bridge.server.close()
    bridge.server.closeAllConnections()
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Bridge failed to start')
  process.exitCode = 1
})

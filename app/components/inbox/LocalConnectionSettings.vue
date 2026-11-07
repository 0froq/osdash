<script setup lang="ts">
import { LOCAL_BRIDGE_ORIGIN } from '#shared/local-bridge'
import { Button } from '@froq/ui'
const { t } = useI18n()

const props = defineProps<{ viewerLogin: string }>()
const bridge = useLocalBridge()
const storage = useStorageDevice()
const unlinkConfirm = ref(false)
const unlinking = ref(false)
const code = ref('')
const origin = ref(LOCAL_BRIDGE_ORIGIN)
const reading = ref(false)
const revoking = ref(false)
const configError = ref('')
const headingId = useId()
function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`
}
const command = computed(() => {
  if (origin.value === 'http://localhost:3000' || origin.value === 'http://127.0.0.1:3000')
    return 'os- serve --profile local --root ~/osdash'
  return origin.value === LOCAL_BRIDGE_ORIGIN
    ? 'os- serve'
    : `os- serve --origin ${shellQuote(origin.value)}`
})
const installCommand = computed(
  () =>
    `curl -fsS ${shellQuote(`${origin.value}/install.sh`)} | ${origin.value === LOCAL_BRIDGE_ORIGIN ? '' : `OS_INSTALL_BASE_URL=${shellQuote(origin.value)} `}sh`,
)
const busy = computed(
  () => bridge.status.value === 'connecting' || reading.value || revoking.value || unlinking.value,
)
const statusText = computed(() => {
  if (storage.device.value)
    return storage.device.value.online ? t('localConnection.online') : t('localConnection.offline')
  if (bridge.status.value === 'connecting') return t('localConnection.connecting')
  return bridge.connected.value ? t('localConnection.connected') : t('localConnection.disconnected')
})

onMounted(() => {
  origin.value = window.location.origin
})

async function pair() {
  if (!props.viewerLogin || busy.value || !code.value.trim()) return
  configError.value = ''
  const submitted = code.value
  code.value = ''
  await bridge.connect(submitted, props.viewerLogin)
  await storage.refresh()
}

async function readConfig() {
  reading.value = true
  configError.value = ''
  try {
    await bridge.refreshConfig()
  } catch {
    configError.value = t('localConnection.configFailed')
  } finally {
    reading.value = false
  }
}

async function unlink() {
  unlinking.value = true
  configError.value = ''
  try {
    await storage.unlink()
    unlinkConfirm.value = false
    await bridge.reset()
  } catch {
    configError.value = t('localConnection.unlinkFailed')
  } finally {
    unlinking.value = false
  }
}

async function disconnect() {
  revoking.value = true
  configError.value = ''
  try {
    await bridge.disconnect()
  } finally {
    revoking.value = false
  }
}
</script>

<template>
  <section
    class="device-settings"
    :aria-labelledby="headingId"
  >
    <h3 :id="headingId">{{ t('localConnection.title') }}</h3>
    <p class="device-note">{{ t('localConnection.optional') }}</p>
    <p
      class="device-status"
      role="status"
      aria-live="polite"
      >{{ statusText }}</p
    >
    <template v-if="storage.device.value">
      <dl class="device-config">
        <dt>{{ t('localConnection.name') }}</dt
        ><dd>{{ storage.device.value.name }}</dd> <dt>{{ t('localConnection.account') }}</dt
        ><dd>{{ viewerLogin }}</dd>
      </dl>
      <div class="device-actions">
        <Button
          type="button"
          :disabled="busy"
          @click="storage.refresh()"
        >
          {{ t('localConnection.refreshStatus') }}
        </Button>
        <Button
          v-if="!unlinkConfirm"
          type="button"
          :disabled="busy"
          @click="unlinkConfirm = true"
        >
          {{ t('localConnection.unlink') }}
        </Button>
      </div>
      <p
        v-if="unlinkConfirm"
        class="device-note"
      >
        {{ t('localConnection.unlinkWarning') }}
        <AppButton
          variant="link"
          :disabled="busy"
          @click="unlink"
        >
          {{ t('localConnection.confirmUnlink') }}
        </AppButton>
        <AppButton
          variant="link"
          :disabled="busy"
          @click="unlinkConfirm = false"
        >
          {{ t('localConnection.keepDevice') }}
        </AppButton>
      </p>
    </template>
    <template v-if="!storage.device.value && !bridge.connected.value">
      <details
        class="device-setup"
        open
      >
        <summary>{{ t('localConnection.setup') }}</summary>
        <p>{{ t('localConnection.install') }}</p>
        <pre><code>{{ installCommand }}</code></pre>
        <p>{{ t('localConnection.workspace') }}</p>
        <pre><code>{{ command }}</code></pre>
        <a
          href="https://github.com/0froq/osdash"
          target="_blank"
          rel="noreferrer"
          >{{ t('localConnection.source') }}</a
        >
        <p>{{ t('localConnection.instructions') }}</p>
      </details>
      <label class="device-code">
        <span>{{ t('localConnection.pairingCode') }}</span>
        <input
          v-model="code"
          type="password"
          autocomplete="off"
          spellcheck="false"
          autocapitalize="none"
          :disabled="busy || !viewerLogin"
          @keydown.enter.prevent="pair"
        />
      </label>
      <p
        v-if="!viewerLogin"
        class="device-note"
        >{{ t('localConnection.signedOut') }}</p
      >
      <div class="device-actions">
        <Button
          type="button"
          :disabled="busy || !viewerLogin || !code.trim()"
          @click="pair"
        >
          {{ t('localConnection.connect') }}
        </Button>
        <Button
          v-if="bridge.status.value === 'connecting'"
          type="button"
          @click="bridge.reset()"
        >
          {{ t('localConnection.cancel') }}
        </Button>
      </div>
      <p class="device-note">{{ t('localConnection.permissions') }}</p>
    </template>
    <template v-if="bridge.connected.value">
      <dl
        v-if="bridge.config.value"
        class="device-config"
      >
        <dt>{{ t('localConnection.account') }}</dt>
        <dd>{{ bridge.account.value?.login }}</dd>
        <dt>{{ t('localConnection.locale') }}</dt>
        <dd>{{ bridge.config.value.locale }}</dd>
        <dt>{{ t('localConnection.notesDirectory') }}</dt>
        <dd>{{
          bridge.config.value.notesConfigured
            ? t('localConnection.configured')
            : t('localConnection.notConfigured')
        }}</dd>
      </dl>
      <div class="device-actions">
        <Button
          type="button"
          :disabled="busy"
          @click="readConfig"
        >
          {{ t('localConnection.refresh') }}
        </Button>
        <Button
          type="button"
          :disabled="busy"
          @click="disconnect"
        >
          {{ t('localConnection.disconnect') }}
        </Button>
      </div>
    </template>
    <div
      v-if="bridge.error.value || storage.error.value || configError"
      class="device-error"
      role="alert"
    >
      <p>{{ configError || storage.error.value || bridge.error.value }}</p>
      <p>{{ t('localConnection.troubleshooting') }}</p>
    </div>
    <p class="device-note">{{ t('localConnection.scope') }}</p>
    <p class="device-note">{{ t('localConnection.lifetime') }}</p>
  </section>
</template>

<style scoped>
.device-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.device-settings h3 {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.device-note,
.device-setup,
.device-config,
.device-error {
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.device-note,
.device-config dt {
  color: var(--muted);
}

.device-status {
  color: var(--fg);
  font-family: var(--font-meta);
  font-size: 12px;
}

.device-setup summary {
  cursor: pointer;
}

.device-setup p,
.device-setup pre {
  margin-top: 10px;
}

.device-setup pre {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--ui-radius);
  font-family: var(--font-meta);
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.device-setup a {
  display: inline-block;
  margin-top: 8px;
  padding: 0 2px;
  border: 0;
  border-bottom: 1px solid color-mix(in oklab, var(--fg) 28%, transparent);
  background-color: transparent;
  background-image: linear-gradient(
    100deg,
    transparent 0.2em,
    color-mix(in oklab, var(--accent) 18%, transparent) 0.35em,
    color-mix(in oklab, var(--accent) 18%, transparent) calc(100% - 0.35em),
    transparent calc(100% - 0.15em)
  );
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0 42%;
  color: var(--fg);
  font: inherit;
  transition:
    background-size var(--dur-2) var(--ease),
    border-color var(--dur-1) var(--ease);
}

.device-setup a:hover {
  border-bottom-color: var(--fg);
  background-size: 100% 42%;
}

.device-code {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.device-code span {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 12px;
}

.device-code input {
  min-width: 0;
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: var(--ui-radius);
  background: transparent;
  color: var(--fg);
  font: inherit;
  transition: border-color var(--dur-1) var(--ease);
}

.device-code input:hover:not(:disabled) {
  border-color: color-mix(in oklab, var(--fg) 28%, transparent);
}

.device-code input:focus-visible {
  border-color: var(--accent);
  outline: 1px solid var(--accent);
  outline-offset: 2px;
}

.device-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.device-code input:disabled {
  cursor: default;
  opacity: 0.5;
}

.device-config {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px 12px;
}

.device-config dt {
  font-family: var(--font-meta);
  font-size: 12px;
}

.device-config dd {
  margin: 0;
}

.device-error {
  color: var(--accent);
}
</style>

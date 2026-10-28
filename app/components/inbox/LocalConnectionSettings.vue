<script setup lang="ts">
import { LOCAL_BRIDGE_ORIGIN } from '#shared/local-bridge'
import { copy } from '~/copy/en'

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
const command = computed(() =>
  origin.value === LOCAL_BRIDGE_ORIGIN
    ? 'os- serve'
    : `os- serve --origin ${shellQuote(origin.value)}`,
)
const installCommand = computed(
  () =>
    `curl -fsS ${shellQuote(`${origin.value}/install.sh`)} | ${origin.value === LOCAL_BRIDGE_ORIGIN ? '' : `OS_INSTALL_BASE_URL=${shellQuote(origin.value)} `}sh`,
)
const busy = computed(
  () => bridge.status.value === 'connecting' || reading.value || revoking.value || unlinking.value,
)
const statusText = computed(() => {
  if (storage.device.value)
    return storage.device.value.online ? copy.localConnection.online : copy.localConnection.offline
  if (bridge.status.value === 'connecting') return copy.localConnection.connecting
  return bridge.connected.value ? copy.localConnection.connected : copy.localConnection.disconnected
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
    configError.value = copy.localConnection.configFailed
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
    configError.value = copy.localConnection.unlinkFailed
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
    <h3 :id="headingId">{{ copy.localConnection.title }}</h3>
    <p class="device-note">{{ copy.localConnection.optional }}</p>
    <p
      class="device-status"
      role="status"
      aria-live="polite"
      >{{ statusText }}</p
    >
    <template v-if="storage.device.value">
      <dl class="device-config">
        <dt>{{ copy.localConnection.name }}</dt
        ><dd>{{ storage.device.value.name }}</dd> <dt>{{ copy.localConnection.account }}</dt
        ><dd>{{ viewerLogin }}</dd>
      </dl>
      <div class="device-actions">
        <button
          type="button"
          :disabled="busy"
          @click="storage.refresh()"
          >{{ copy.localConnection.refreshStatus }}</button
        >
        <button
          v-if="!unlinkConfirm"
          type="button"
          :disabled="busy"
          @click="unlinkConfirm = true"
          >{{ copy.localConnection.unlink }}</button
        >
      </div>
      <p
        v-if="unlinkConfirm"
        class="device-note"
      >
        {{ copy.localConnection.unlinkWarning }}
        <button
          type="button"
          :disabled="busy"
          @click="unlink"
          >{{ copy.localConnection.confirmUnlink }}</button
        >
        <button
          type="button"
          :disabled="busy"
          @click="unlinkConfirm = false"
          >{{ copy.localConnection.keepDevice }}</button
        >
      </p>
    </template>
    <template v-if="!storage.device.value && !bridge.connected.value">
      <details
        class="device-setup"
        open
      >
        <summary>{{ copy.localConnection.setup }}</summary>
        <p>{{ copy.localConnection.install }}</p>
        <pre><code>{{ installCommand }}</code></pre>
        <p>{{ copy.localConnection.workspace }}</p>
        <pre><code>{{ command }}</code></pre>
        <a
          href="https://github.com/0froq/osdash"
          target="_blank"
          rel="noreferrer"
          >{{ copy.localConnection.source }}</a
        >
        <p>{{ copy.localConnection.instructions }}</p>
      </details>
      <label class="device-code">
        <span>{{ copy.localConnection.pairingCode }}</span>
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
        >{{ copy.localConnection.signedOut }}</p
      >
      <div class="device-actions">
        <button
          type="button"
          :disabled="busy || !viewerLogin || !code.trim()"
          @click="pair"
        >
          {{ copy.localConnection.connect }}
        </button>
        <button
          v-if="bridge.status.value === 'connecting'"
          type="button"
          @click="bridge.reset()"
        >
          {{ copy.localConnection.cancel }}
        </button>
      </div>
      <p class="device-note">{{ copy.localConnection.permissions }}</p>
    </template>
    <template v-if="bridge.connected.value">
      <dl
        v-if="bridge.config.value"
        class="device-config"
      >
        <dt>{{ copy.localConnection.account }}</dt>
        <dd>{{ bridge.account.value?.login }}</dd>
        <dt>{{ copy.localConnection.locale }}</dt>
        <dd>{{ bridge.config.value.locale }}</dd>
        <dt>{{ copy.localConnection.notesDirectory }}</dt>
        <dd>{{
          bridge.config.value.notesConfigured
            ? copy.localConnection.configured
            : copy.localConnection.notConfigured
        }}</dd>
      </dl>
      <div class="device-actions">
        <button
          type="button"
          :disabled="busy"
          @click="readConfig"
          >{{ copy.localConnection.refresh }}</button
        >
        <button
          type="button"
          :disabled="busy"
          @click="disconnect"
          >{{ copy.localConnection.disconnect }}</button
        >
      </div>
    </template>
    <div
      v-if="bridge.error.value || storage.error.value || configError"
      class="device-error"
      role="alert"
    >
      <p>{{ configError || storage.error.value || bridge.error.value }}</p>
      <p>{{ copy.localConnection.troubleshooting }}</p>
    </div>
    <p class="device-note">{{ copy.localConnection.scope }}</p>
    <p class="device-note">{{ copy.localConnection.lifetime }}</p>
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
  font-size: 17px;
  font-weight: 600;
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
  padding: 10px;
  background: var(--soft);
  font-family: var(--font-meta);
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.device-setup a {
  display: inline-block;
  margin-top: 8px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.device-code {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.device-code input {
  min-width: 0;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg);
  color: var(--fg);
  font: inherit;
}

.device-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.device-actions button {
  min-height: 32px;
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
}

.device-actions button:hover:not(:disabled) {
  background: var(--soft);
}

.device-actions button:disabled,
.device-code input:disabled {
  cursor: default;
  opacity: 0.5;
}

.device-config {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px 12px;
}

.device-config dd {
  margin: 0;
}

.device-error {
  color: var(--accent);
}
</style>

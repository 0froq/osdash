<script setup lang="ts">
import { copy } from '~/copy/en'

useHead({
  meta: [{ name: 'robots', content: 'index,follow' }],
})

onMounted(async () => {
  try {
    const me = await $fetch<{ authenticated: boolean }>('/api/auth/me')
    if (me.authenticated) await navigateTo('/')
  } catch {
    /* Stay on the login page when the session check fails. */
  }
})

function signIn(): void {
  window.location.href = '/api/auth/login'
}
</script>

<template>
  <main class="login-page">
    <h1>{{ copy.brand }}</h1>
    <p class="login-tagline">{{ copy.login.tagline }}</p>
    <button
      class="login-action"
      type="button"
      @click="signIn"
    >
      {{ copy.login.action }}
    </button>
    <p class="login-note">{{ copy.login.scope }}</p>
    <p class="login-note">{{ copy.login.readOnly }}</p>
  </main>
</template>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  justify-content: center;
  width: min(420px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: 32px 20px;
  text-align: left;
}

.login-page h1 {
  font-family: var(--font-display);
  font-size: 56px;
  line-height: 1;
}

.login-tagline {
  color: var(--muted);
  font-size: 16px;
}

.login-action {
  min-height: 44px;
  margin-top: 12px;
  padding: 0 22px;
  border: 0;
  border-radius: 999px;
  background: var(--fg);
  color: var(--bg);
  cursor: pointer;
  font-size: 15px;
  transition: opacity var(--dur-1) var(--ease);
}

.login-action:hover {
  opacity: 0.86;
}

.login-note {
  color: var(--muted);
  font-size: 13px;
}
</style>

<script setup lang="ts">
import { copy } from '~/copy/zh-CN'

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

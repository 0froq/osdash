<script setup lang="ts">
const { t } = useI18n()

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
    <h1>{{ t('brand') }}</h1>
    <p class="login-tagline">{{ t('login.tagline') }}</p>
    <AppButton
      variant="fill"
      class="login-action"
      @click="signIn"
    >
      {{ t('login.action') }}
    </AppButton>
    <p class="login-note">{{ t('login.scope') }}</p>
    <p class="login-note">{{ t('login.readOnly') }}</p>
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
  font-size: 15px;
}

.login-note {
  color: var(--muted);
  font-size: 13px;
}
</style>

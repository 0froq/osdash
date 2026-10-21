<script setup lang="ts">
const error = ref('')

onMounted(async () => {
  try {
    const me = await $fetch<{ authenticated: boolean }>('/api/auth/me')
    if (me.authenticated) await navigateTo('/')
  } catch {
    /* ignore */
  }
})

function signIn() {
  window.location.href = '/api/auth/login'
}
</script>

<template>
  <main class="board login">
    <header class="top">
      <div class="brand">
        <h1>osdash</h1>
        <p class="quiet">Your open-source contribution board</p>
      </div>
    </header>
    <p
      class="error"
      v-if="error"
      >{{ error }}</p
    >
    <p>
      <button
        class="refresh"
        type="button"
        @click="signIn"
        >Sign in with GitHub</button
      >
    </p>
    <p class="quiet">Uses GitHub OAuth with read-only <code>read:user</code> scope.</p>
  </main>
</template>

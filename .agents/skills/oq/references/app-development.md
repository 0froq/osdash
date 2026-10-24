---
name: app-development
description: Vue/Nuxt/UnoCSS application conventions. Use when building web apps with oQ's preferred stack.
---

# App Development

## Framework Selection

| Use Case | Choice |
|----------|--------|
| SPA, client-only, library playgrounds | Vite + Vue |
| SSR, SSG, SEO-critical, file-based routing, API routes | Nuxt |

## Vue Conventions

### Script Setup

Always use `script setup` with TypeScript:

```vue
<script setup lang="ts">
// Component logic here
</script>

<template>
  <!-- Template here -->
</template>
```

### State Management

| Scenario | Choice |
|----------|--------|
| Component state | `shallowRef()` over `ref()` |
| Objects | Use `ref()`, avoid `reactive()` |
| Global state | Pinia |
| URL state | `useRoute()` / `useRouter()` |

### Props and Emits

Always type with interfaces:

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
}

interface Emits {
  (e: 'update', value: number): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
})

const emit = defineEmits<Emits>()
</script>
```

### Component Structure

```vue
<script setup lang="ts">
// 1. Imports
import { computed } from 'vue'
import type { SomeType } from './types'

// 2. Types (if not in separate file)
interface Props { }

// 3. Props & Emits
const props = defineProps<Props>()
const emit = defineEmits(['update'])

// 4. Composables
const { data } = useFetch('/api/data')
const route = useRoute()

// 5. Reactive state
const count = shallowRef(0)

// 6. Computed
const doubled = computed(() => count.value * 2)

// 7. Methods
function increment() {
  count.value++
}

// 8. Watchers
watch(count, (newVal) => {
  emit('update', newVal)
})
</script>

<template>
  <div class="component-name">
    <!-- Template -->
  </div>
</template>

<style scoped>
.component-name {
  /* Styles */
}
</style>
```

## UnoCSS Conventions

### Attribute Usage

Always use `un-` prefixed attributes:

```vue
<!-- ❌ Standard class -->
<div class="flex items-center justify-between p-4 bg-gray-100">

<!-- ✅ Prefixed attributify -->
<div
  un-flex
  un-items-center
  un-justify-between
  un-p-4
  un-bg-gray-100
>
```

### Shortcuts

Use defined shortcuts for common patterns:

```vue
<!-- `page-content` shortcut -->
<main class="page-content">
  <!-- Content centered with max-width -->
</main>
```

### Icon Usage

```vue
<!-- Icon components -->
<div class="i-carbon-close" />
<div class="i-solar-home" />
<div class="i-openmoji-rocket" />

<!-- With sizing -->
<div class="i-carbon-close text-2xl" />
<div class="i-carbon-close w-6 h-6" />
```

### Responsive Design

```vue
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
  <!-- Responsive grid -->
</div>
```

Custom breakpoints:
- `sm`: 600px
- `md`: 900px

## Nuxt Conventions

### File Structure

```
app/
├── components/        # Vue components
│   ├── ui/           # UI primitives
│   ├── forms/        # Form components
│   └── layouts/      # Layout components
├── composables/       # Auto-imported composables
├── layouts/          # Page layouts
├── pages/            # File-based routes
├── server/           # API routes
│   └── api/          # Server API
├── types/            # TypeScript types
├── utils/            # Utility functions
├── app.vue           # App root
└── nuxt.config.ts    # Nuxt configuration
```

### Server Routes

```ts
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  // Handle GET /api/users
  return await fetchUsers()
})

// server/api/users.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await createUser(body)
})
```

### Composables

Place in `composables/` for auto-import:

```ts
// composables/useUser.ts
export function useUser() {
  const user = useState('user', () => null)
  
  async function login(credentials) {
    user.value = await $fetch('/api/login', {
      method: 'POST',
      body: credentials
    })
  }
  
  return {
    user: readonly(user),
    login
  }
}
```

### Layouts

```vue
<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen">
    <AppHeader />
    <main class="page-content">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
```

## Font Usage

### Apply Font Classes

```vue
<template>
  <!-- Sans-serif body text -->
  <p class="font-sans">Regular text</p>
  
  <!-- Serif for elegance -->
  <blockquote class="font-serif">Quote text</blockquote>
  
  <!-- Monospace for code -->
  <code class="font-mono">console.log()</code>
  
  <!-- Stylish handwriting -->
  <h1 class="font-stylish">Title</h1>
  
  <!-- Script for special -->
  <span class="font-script">Signature</span>
</template>
```

## Utilities

### Preferred Libraries

| Purpose | Library |
|---------|---------|
| Vue utilities | @vueuse/core |
| HTTP client | $fetch (built-in) |
| Date formatting | date-fns or Intl.DateTimeFormat |
| Validation | zod |
| Testing | vitest + @vue/test-utils |

### VueUse Composables

```ts
// Common VueUse composables
import { 
  useDark, 
  useToggle, 
  useStorage,
  useFetch,
  useIntersectionObserver 
} from '@vueuse/core'
```

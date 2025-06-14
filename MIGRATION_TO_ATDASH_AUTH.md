# Migration Guide: Using @atdash/auth

This guide shows how to migrate the chess app to use the shared @atdash/auth module.

## Step 1: Install the Package

Once published to npm:
```bash
npm install @atdash/auth
```

For now, during development:
```bash
# From the chess directory
cd packages/atdash-auth
npm install
npm run build
cd ../..
npm install ./packages/atdash-auth
```

## Step 2: Update main.js

```javascript
// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createAtdashAuth } from '@atdash/auth' // Add this
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

// Configure auth with atdash module
app.use(createAtdashAuth({
  appId: 'chess',
  appName: 'AT Chess',
  appUrl: window.location.origin,
  allowedOrigins: [
    'https://chess.atdash.app',
    'https://music.atdash.app',
    'https://photos.atdash.app',
    'https://auth.atdash.app',
    '*.atdash.app' // Allow all atdash subdomains
  ],
  debug: import.meta.env.DEV
}))

app.use(pinia)
app.use(router)

app.mount('#app')
```

## Step 3: Update User Store

```javascript
// src/stores/user.js
import { defineStore } from 'pinia'
import { useAtdashAuth } from '@atdash/auth'

export const useUserStore = defineStore('user', () => {
  // Get auth from the composable
  const auth = useAtdashAuth()
  
  // Use auth state directly
  const isAuthenticated = auth.isAuthenticated
  const user = auth.user
  
  // Chess-specific data
  const chessProfile = ref({
    elo: 1500,
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    peak: 1500,
    title: '',
    country: ''
  })
  
  // Methods now use the auth module
  async function login(identifier, password) {
    const result = await auth.login(identifier, password)
    
    if (result.success) {
      // Load chess-specific profile
      await loadChessProfile(result.session.did)
    }
    
    return result
  }
  
  async function loginWithOAuth(handle) {
    return await auth.loginWithOAuth(handle)
  }
  
  async function logout() {
    await auth.logout()
    resetChessProfile()
  }
  
  // ... rest of chess-specific logic
  
  return {
    // Auth state from module
    isAuthenticated,
    user,
    
    // Chess-specific state
    chessProfile,
    
    // Methods
    login,
    loginWithOAuth,
    logout,
    // ... other methods
  }
})
```

## Step 4: Update Login Component

```vue
<!-- src/views/Login.vue -->
<template>
  <div class="login-container max-w-md mx-auto">
    <div class="card">
      <h1 class="text-2xl font-bold mb-6">Login with AT Protocol</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- ... form fields ... -->
      </form>
      
      <!-- ... rest of template ... -->
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAtdashAuth } from '@atdash/auth'
import { PDSDiscovery } from '@atdash/auth'
import { Loader2 } from 'lucide-vue-next'

const router = useRouter()
const { login, loginWithOAuth, loading, error } = useAtdashAuth()
const pdsDiscovery = new PDSDiscovery()

const identifier = ref('')
const password = ref('')
const pdsInfo = ref(null)

// ... rest of component logic using the auth module
</script>
```

## Step 5: Remove Old Auth Files

Once migrated, you can remove:
- `src/services/AtprotoService.js`
- `src/services/PDSDiscovery.js`

## Benefits of Migration

1. **Shared Code**: All atdash apps use the same auth logic
2. **SSO Support**: Users logged into one app are automatically logged into others
3. **Maintenance**: Bug fixes and improvements benefit all apps
4. **Consistency**: Same auth experience across all apps
5. **Future Features**: New auth features automatically available

## SSO Flow

When a user visits the chess app:

1. App checks for existing session
2. If no local session, checks other atdash apps via SSO
3. If found, user is automatically logged in
4. If not found, user sees login screen
5. After login, session is shared with other apps

## Cross-App Features

```javascript
// In App.vue or main component
onMounted(async () => {
  const { checkSSO } = useAtdashAuth()
  
  // Check if user is logged in to another atdash app
  const session = await checkSSO()
  
  if (session) {
    // User is already authenticated!
    // Load chess-specific data
    await loadUserChessProfile(session.did)
  }
})
```

## Debugging

Enable debug mode during development:

```javascript
app.use(createAtdashAuth({
  appId: 'chess',
  appName: 'AT Chess',
  debug: true // Shows detailed logs
}))
```

This will log:
- PDS discovery attempts
- Authentication flows
- Cross-domain communication
- Session management

## Next Steps

1. Build and test the auth package
2. Publish to npm (or internal registry)
3. Migrate each atdash app one by one
4. Set up central auth service for OAuth
5. Deploy and test SSO across apps
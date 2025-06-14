# @atdash/auth

Shared authentication module for AT Protocol apps with SSO support. This package provides a unified authentication experience across all atdash applications with support for both Bluesky and custom PDS instances.

## Features

- 🔐 **Universal AT Protocol Authentication** - Works with Bluesky and custom PDS
- 🔄 **Single Sign-On (SSO)** - Login once, access all atdash apps
- 🌐 **Cross-Domain Authentication** - Secure auth sharing between apps
- 🔍 **Automatic PDS Discovery** - Auto-detects user's PDS from handle
- 💾 **Flexible Storage** - Support for localStorage, sessionStorage, or memory
- 🎨 **Framework Support** - Vue 3 composable included, React coming soon
- 🔒 **Security First** - Token rotation, secure storage, CSRF protection

## Installation

```bash
npm install @atdash/auth @atproto/api

# or
yarn add @atdash/auth @atproto/api

# or
pnpm add @atdash/auth @atproto/api
```

## Quick Start

### Vue 3

```javascript
// main.js
import { createApp } from 'vue'
import { createAtdashAuth } from '@atdash/auth'
import App from './App.vue'

const app = createApp(App)

// Configure auth
app.use(createAtdashAuth({
  appId: 'chess',
  appName: 'AT Chess',
  // Optional configurations
  storage: 'localStorage', // or 'sessionStorage' or 'memory'
  debug: true
}))

app.mount('#app')
```

```vue
<!-- LoginComponent.vue -->
<template>
  <div>
    <div v-if="!isAuthenticated">
      <input v-model="identifier" placeholder="user.bsky.social" />
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="handleLogin" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
    
    <div v-else>
      <p>Welcome, {{ user.handle }}!</p>
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAtdashAuth } from '@atdash/auth'

const { isAuthenticated, user, loading, error, login, logout } = useAtdashAuth()

const identifier = ref('')
const password = ref('')

async function handleLogin() {
  const result = await login(identifier.value, password.value)
  if (result.success) {
    console.log('Logged in!')
  }
}
</script>
```

### Vanilla JavaScript

```javascript
import { AtdashAuth } from '@atdash/auth'

// Initialize
const auth = new AtdashAuth({
  appId: 'myapp',
  appName: 'My AT App'
})

// Login
async function login(identifier, password) {
  const result = await auth.login(identifier, password)
  
  if (result.success) {
    console.log('Logged in:', result.session)
  } else {
    console.error('Login failed:', result.error)
  }
}

// Check authentication
if (auth.isAuthenticated()) {
  const user = auth.getUser()
  console.log('Current user:', user)
}

// Listen for auth changes
auth.on('session-change', (session) => {
  if (session) {
    console.log('User logged in:', session.handle)
  } else {
    console.log('User logged out')
  }
})
```

## Custom PDS Support

The auth module automatically detects and connects to custom PDS instances:

```javascript
// Bluesky users
await login('alice.bsky.social', 'password')  // → Uses bsky.social
await login('alice', 'password')              // → Uses bsky.social

// Custom PDS users
await login('bob@custom-pds.com', 'password') // → Auto-discovers PDS
await login('bob.custom-pds.com', 'password') // → Auto-discovers PDS
```

## SSO Between Apps

The auth module enables automatic SSO between atdash apps:

```javascript
// In your app initialization
onMounted(async () => {
  // Check if user is already logged in to another atdash app
  const session = await auth.checkSSO()
  
  if (session) {
    console.log('User already authenticated via SSO!')
  }
})

// SSO is automatic - when user logs into one app,
// other apps will detect the session
```

## API Reference

### AtdashAuth

#### Constructor
```typescript
new AtdashAuth(config: AtdashAuthConfig)
```

#### Config Options
- `appId` (required): Unique identifier for your app
- `appName` (required): Display name for your app
- `appUrl`: Your app's URL (defaults to current origin)
- `redirectUri`: OAuth callback URL
- `authServiceUrl`: Central auth service URL
- `allowedOrigins`: Array of allowed origins for SSO
- `storage`: Storage type ('localStorage' | 'sessionStorage' | 'memory')
- `debug`: Enable debug logging

#### Methods

##### Authentication
- `login(identifier: string, password: string): Promise<LoginResult>`
- `loginWithOAuth(handle?: string): Promise<LoginResult>`
- `logout(): Promise<void>`
- `logoutEverywhere(): Promise<void>`
- `refreshSession(): Promise<boolean>`

##### Session Management
- `getSession(): AtdashSession | null`
- `getUser(): AtdashUser | null`
- `isAuthenticated(): boolean`
- `checkSSO(): Promise<AtdashSession | null>`

##### Events
- `on(event: string, callback: Function): void`
- `off(event: string, callback: Function): void`

Available events:
- `session-change`: Fired when session changes (login/logout)
- `session-expired`: Fired when session expires

### Vue Composable

```typescript
const {
  // State
  session,        // Readonly<Ref<AtdashSession | null>>
  isAuthenticated, // Readonly<ComputedRef<boolean>>
  user,           // Readonly<ComputedRef<AtdashUser | null>>
  loading,        // Readonly<Ref<boolean>>
  error,          // Readonly<Ref<string | null>>
  
  // Methods
  login,
  loginWithOAuth,
  logout,
  logoutEverywhere,
  refreshSession,
  checkSSO
} = useAtdashAuth()
```

## Advanced Usage

### Custom Storage Adapter

```javascript
import { AtdashAuth, StorageAdapter } from '@atdash/auth'

class CustomStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    // Your custom storage logic
  }
  
  async set(key: string, value: string): Promise<void> {
    // Your custom storage logic
  }
  
  async remove(key: string): Promise<void> {
    // Your custom storage logic
  }
  
  async clear(): Promise<void> {
    // Your custom storage logic
  }
}

const auth = new AtdashAuth({
  appId: 'myapp',
  appName: 'My App',
  storage: new CustomStorageAdapter()
})
```

### PDS Discovery

```javascript
import { PDSDiscovery } from '@atdash/auth'

const discovery = new PDSDiscovery()

// Discover PDS for a handle
const pdsInfo = await discovery.fromHandle('user@custom-pds.com')
console.log(pdsInfo)
// {
//   service: 'https://custom-pds.com',
//   type: 'custom',
//   authEndpoint: 'https://custom-pds.com/xrpc',
//   apiEndpoint: 'https://custom-pds.com/xrpc'
// }
```

### Cross-Domain Communication

```javascript
import { CrossDomainAuth } from '@atdash/auth'

const crossAuth = new CrossDomainAuth([
  'https://app1.example.com',
  'https://app2.example.com'
])

// Try to get session from other apps
const session = await crossAuth.tryMultipleApps([
  'https://app1.example.com',
  'https://app2.example.com'
])
```

## Security Considerations

1. **Token Storage**: Tokens are stored securely based on your storage configuration
2. **Cross-Origin**: Only configured origins can participate in SSO
3. **Token Refresh**: Automatic token refresh before expiration
4. **Secure Communication**: All cross-domain messages are validated

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/atdash/auth/blob/main/CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](https://github.com/atdash/auth/blob/main/LICENSE) for details.
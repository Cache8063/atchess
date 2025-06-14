# AT Dash SSO Architecture

## Overview
A unified Single Sign-On (SSO) solution for all AT Protocol applications in the atdash ecosystem, enabling users to authenticate once and access all connected apps seamlessly.

## Core Components

### 1. Central Auth Service (`auth.atdash.app`)
```typescript
interface AtdashAuthService {
  // Core authentication
  login(identifier: string, password: string): Promise<Session>
  loginWithOAuth(pds?: string): Promise<void>
  logout(): Promise<void>
  refresh(): Promise<Session>
  
  // PDS discovery
  discoverPDS(handle: string): Promise<PDSInfo>
  
  // Session management
  getSession(): Session | null
  isAuthenticated(): boolean
  
  // Cross-app communication
  broadcastAuth(session: Session): void
  listenForAuth(callback: (session: Session) => void): void
}
```

### 2. PDS Discovery Service
```typescript
interface PDSInfo {
  service: string      // e.g., "https://bsky.social" or "https://custom.pds.com"
  type: 'bsky' | 'custom'
  authEndpoint: string
  apiEndpoint: string
  capabilities: string[]
}

class PDSDiscovery {
  async fromHandle(handle: string): Promise<PDSInfo> {
    // Check if it's a .bsky.social handle
    if (handle.endsWith('.bsky.social') || !handle.includes('.')) {
      return {
        service: 'https://bsky.social',
        type: 'bsky',
        authEndpoint: 'https://bsky.social/xrpc',
        apiEndpoint: 'https://bsky.social/xrpc',
        capabilities: ['com.atproto.*', 'app.bsky.*']
      }
    }
    
    // For custom domains, perform .well-known lookup
    const domain = handle.split('@').pop()
    try {
      const wellKnown = await fetch(`https://${domain}/.well-known/atproto-did`)
      const did = await wellKnown.text()
      
      // Resolve DID to get PDS endpoint
      const pds = await this.resolveDID(did)
      return pds
    } catch {
      // Fallback to direct PDS check
      return this.checkDirectPDS(`https://${domain}`)
    }
  }
}
```

### 3. Shared Session Store
```typescript
interface SharedSession {
  did: string
  handle: string
  accessJwt: string
  refreshJwt: string
  pds: PDSInfo
  expiresAt: number
  apps: string[]  // List of apps that have accessed this session
}

class SessionStore {
  private readonly STORAGE_KEY = 'atdash_shared_session'
  private readonly CHANNEL = new BroadcastChannel('atdash_auth')
  
  async save(session: SharedSession): Promise<void> {
    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session))
    
    // Broadcast to other tabs/apps
    this.CHANNEL.postMessage({ type: 'session_update', session })
    
    // Save to secure storage if available
    if ('credentials' in navigator) {
      await this.saveToCredentialStore(session)
    }
  }
  
  async get(): Promise<SharedSession | null> {
    // Check multiple sources
    const sources = [
      () => this.getFromLocalStorage(),
      () => this.getFromSessionStorage(),
      () => this.getFromCredentialStore(),
      () => this.getFromCookie()
    ]
    
    for (const source of sources) {
      const session = await source()
      if (session && !this.isExpired(session)) {
        return session
      }
    }
    
    return null
  }
}
```

### 4. Cross-Domain Communication
```typescript
class CrossDomainAuth {
  private readonly ALLOWED_ORIGINS = [
    'https://chess.atdash.app',
    'https://music.atdash.app',
    'https://photos.atdash.app',
    // ... other atdash apps
  ]
  
  async requestAuth(targetApp: string): Promise<SharedSession> {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = `${targetApp}/auth/bridge`
      
      const handler = (event: MessageEvent) => {
        if (!this.ALLOWED_ORIGINS.includes(event.origin)) return
        
        if (event.data.type === 'auth_response') {
          window.removeEventListener('message', handler)
          document.body.removeChild(iframe)
          
          if (event.data.session) {
            resolve(event.data.session)
          } else {
            reject(new Error('No session available'))
          }
        }
      }
      
      window.addEventListener('message', handler)
      document.body.appendChild(iframe)
      
      // Request auth after iframe loads
      iframe.onload = () => {
        iframe.contentWindow?.postMessage(
          { type: 'auth_request', app: window.location.origin },
          targetApp
        )
      }
    })
  }
}
```

## Implementation Flow

### 1. Initial Login (Any App)
```typescript
// In chess.atdash.app
const auth = new AtdashAuth()

async function login(identifier: string, password: string) {
  // Discover PDS from handle
  const pds = await auth.discoverPDS(identifier)
  
  // Create agent for specific PDS
  const agent = new BskyAgent({ service: pds.service })
  
  // Authenticate
  const session = await agent.login({ identifier, password })
  
  // Save to shared session store
  await auth.saveSharedSession({
    ...session.data,
    pds,
    apps: ['chess.atdash.app']
  })
  
  // Broadcast to other apps
  auth.broadcastAuth(session.data)
}
```

### 2. SSO from Another App
```typescript
// In music.atdash.app
const auth = new AtdashAuth()

async function checkSSO() {
  // Check local shared session
  const session = await auth.getSharedSession()
  
  if (session) {
    // Validate session is still valid
    if (await auth.validateSession(session)) {
      // Add this app to the session's app list
      session.apps.push('music.atdash.app')
      await auth.saveSharedSession(session)
      
      return session
    }
  }
  
  // Try cross-domain auth
  try {
    const crossDomainSession = await auth.requestCrossDomainAuth([
      'https://chess.atdash.app',
      'https://auth.atdash.app'
    ])
    
    if (crossDomainSession) {
      return crossDomainSession
    }
  } catch (error) {
    console.log('No SSO available')
  }
  
  // Redirect to auth app
  window.location.href = `https://auth.atdash.app/login?redirect=${encodeURIComponent(window.location.href)}`
}
```

### 3. Shared Auth Component
```vue
<!-- SharedAuthButton.vue -->
<template>
  <div class="atdash-auth">
    <button v-if="!isAuthenticated" @click="login" class="auth-button">
      <AtprotoLogo class="w-5 h-5 mr-2" />
      Login with AT Protocol
    </button>
    
    <div v-else class="auth-menu">
      <button @click="toggleMenu" class="auth-user">
        <img :src="user.avatar" :alt="user.handle" class="avatar">
        <span>{{ user.handle }}</span>
        <ChevronDown class="w-4 h-4" />
      </button>
      
      <div v-if="showMenu" class="auth-dropdown">
        <div class="auth-apps">
          <h4>Your AT Dash Apps</h4>
          <a v-for="app in availableApps" :key="app.id" 
             :href="app.url" class="app-link">
            <component :is="app.icon" class="w-4 h-4" />
            {{ app.name }}
          </a>
        </div>
        
        <div class="auth-actions">
          <button @click="switchAccount">Switch Account</button>
          <button @click="logout">Logout Everywhere</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAtdashAuth } from '@atdash/auth-sdk'

const auth = useAtdashAuth()
const { isAuthenticated, user, availableApps } = auth

const login = async () => {
  // Check if we can SSO from another app
  const ssoAvailable = await auth.checkSSO()
  
  if (ssoAvailable) {
    await auth.loginWithSSO()
  } else {
    // Show login modal or redirect to auth.atdash.app
    await auth.showLoginModal()
  }
}

const logout = async () => {
  if (confirm('Logout from all AT Dash apps?')) {
    await auth.logoutEverywhere()
  }
}
</script>
```

## SDK Package Structure

### `@atdash/auth-sdk`
```typescript
// Main SDK for all apps
export class AtdashAuth {
  constructor(config: {
    appId: string
    appName: string
    redirectUri?: string
  })
  
  // Core methods
  async login(identifier: string, password: string): Promise<Session>
  async loginWithSSO(): Promise<Session | null>
  async logout(): Promise<void>
  async logoutEverywhere(): Promise<void>
  
  // PDS support
  async discoverPDS(handle: string): Promise<PDSInfo>
  
  // Session management
  getSession(): Session | null
  onSessionChange(callback: (session: Session | null) => void): void
  
  // App discovery
  getAvailableApps(): AtdashApp[]
  registerApp(app: AtdashApp): void
}

// Vue composable
export function useAtdashAuth() {
  const auth = inject('atdash-auth')
  const session = ref(auth.getSession())
  
  // ... reactive auth state
  
  return {
    isAuthenticated,
    user,
    login,
    logout,
    // ...
  }
}
```

## Security Considerations

### 1. Token Security
- Store refresh tokens in httpOnly cookies when possible
- Use secure session storage with encryption
- Implement token rotation on refresh

### 2. Cross-Origin Security
- Strict origin validation for all cross-domain communication
- Use Content Security Policy headers
- Implement CSRF protection

### 3. PDS Validation
- Verify PDS endpoints support required AT Protocol methods
- Validate SSL certificates for custom PDS instances
- Check PDS capabilities before attempting operations

## Migration Guide for Existing Apps

### 1. Install SDK
```bash
npm install @atdash/auth-sdk
```

### 2. Update Auth Service
```typescript
// Before
const agent = new BskyAgent({ service: 'https://bsky.social' })
await agent.login({ identifier, password })

// After
import { AtdashAuth } from '@atdash/auth-sdk'

const auth = new AtdashAuth({
  appId: 'chess',
  appName: 'AT Chess'
})

await auth.login(identifier, password)
```

### 3. Add SSO Support
```typescript
// In main.ts or App.vue
onMounted(async () => {
  const session = await auth.checkSSO()
  if (session) {
    console.log('User already authenticated via SSO!')
  }
})
```

## Benefits

1. **User Experience**
   - Login once, access all atdash apps
   - Seamless app switching
   - Consistent auth UI across apps

2. **Developer Experience**
   - Simple SDK integration
   - Automatic PDS discovery
   - Built-in session management

3. **Security**
   - Centralized security updates
   - Consistent security policies
   - Easier audit trail

4. **Custom PDS Support**
   - Works with any AT Protocol server
   - Automatic endpoint discovery
   - Graceful fallbacks
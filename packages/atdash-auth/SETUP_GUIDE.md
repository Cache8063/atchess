# @atdash/auth Setup Guide

## Quick Setup for Vue Apps

### 1. Install the Package

```bash
npm install @atdash/auth @atproto/api broadcast-channel
```

### 2. Configure in main.js

```javascript
import { createApp } from 'vue'
import { createAtdashAuth } from '@atdash/auth'
import App from './App.vue'

const app = createApp(App)

app.use(createAtdashAuth({
  appId: 'your-app-id',      // Unique ID for your app
  appName: 'Your App Name',   // Display name
  debug: true                 // Enable debug logs in development
}))

app.mount('#app')
```

### 3. Set Up Auth Bridge Route (REQUIRED for SSO)

For SSO to work between atdash apps, you must set up the auth bridge route:

```javascript
// router.js
import { AuthBridge } from '@atdash/auth'

const routes = [
  // ... your other routes
  
  // Add this route for cross-domain SSO
  {
    path: '/auth/bridge',
    name: 'auth-bridge',
    component: AuthBridge,
    meta: { 
      layout: 'blank' // If you use layouts, use a blank one
    }
  }
]
```

Or if you don't use Vue Router, add it to your App.vue:

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <!-- Your app content -->
    <router-view />
    
    <!-- Add AuthBridge component -->
    <AuthBridge :debug="false" />
  </div>
</template>

<script setup>
import { AuthBridge } from '@atdash/auth'
</script>
```

### 4. Use Authentication in Components

```vue
<template>
  <div>
    <div v-if="!isAuthenticated">
      <button @click="login">Login</button>
    </div>
    <div v-else>
      <p>Welcome, {{ user.handle }}!</p>
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAtdashAuth } from '@atdash/auth'

const { isAuthenticated, user, checkSSO, login, logout } = useAtdashAuth()

// Check for SSO on mount
onMounted(async () => {
  await checkSSO()
})
</script>
```

## Configuration Options

### Basic Configuration
```javascript
{
  appId: 'chess',           // Required: Unique app identifier
  appName: 'AT Chess'       // Required: Display name
}
```

### Advanced Configuration
```javascript
{
  appId: 'chess',
  appName: 'AT Chess',
  appUrl: 'https://chess.atdash.app',
  redirectUri: 'https://chess.atdash.app/auth/callback',
  authServiceUrl: 'https://auth.atdash.app',
  allowedOrigins: [
    '*.atdash.app',                    // Wildcard for all subdomains
    'https://specific-app.com',        // Specific domain
    'http://localhost:3000'            // Local development
  ],
  storage: 'localStorage',             // or 'sessionStorage' or 'memory'
  debug: process.env.NODE_ENV === 'development'
}
```

## SSO Flow Explained

1. **User visits App A** (e.g., chess.atdash.app)
   - App checks local session → Not found
   - App checks SSO from other apps → Not found
   - User logs in
   - Session saved locally and broadcast to other tabs

2. **User visits App B** (e.g., music.atdash.app)
   - App checks local session → Not found
   - App checks SSO from other apps
   - Finds session from App A via iframe communication
   - User automatically logged in!

## Security Notes

### CORS Configuration

If hosting your own apps, ensure your server allows cross-origin requests from other atdash apps:

```javascript
// Express example
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://chess.atdash.app',
    'https://music.atdash.app',
    'https://photos.atdash.app'
  ]
  
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  
  next()
})
```

### Content Security Policy

Update your CSP to allow iframe communication:

```html
<meta http-equiv="Content-Security-Policy" 
      content="frame-src 'self' *.atdash.app; 
               connect-src 'self' *.atdash.app https://bsky.social;">
```

## Troubleshooting

### SSO Not Working

1. **Check Auth Bridge Route**: Ensure `/auth/bridge` route is accessible
2. **Check Console**: Look for cross-origin errors
3. **Verify Origins**: Make sure app origins are in `allowedOrigins`
4. **Debug Mode**: Enable `debug: true` to see detailed logs

### PDS Discovery Failing

1. **Check Handle Format**: Should be `user@domain.com` or `user.domain.com`
2. **Verify PDS**: Ensure the PDS supports AT Protocol
3. **Check Network**: Some PDS might be behind firewalls

### Token Expiration

The auth module automatically refreshes tokens, but you can manually refresh:

```javascript
const { refreshSession } = useAtdashAuth()

// Manually refresh
const success = await refreshSession()
if (!success) {
  // Token refresh failed, user needs to login again
}
```

## Example Apps

Check out these example implementations:

- [Chess App](https://github.com/atdash/chess)
- [Music App](https://github.com/atdash/music)
- [Photos App](https://github.com/atdash/photos)

## Support

- [GitHub Issues](https://github.com/atdash/auth/issues)
- [Discord Community](https://discord.gg/atdash)
- [Documentation](https://docs.atdash.app/auth)
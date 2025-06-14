import { ref, computed, readonly, onMounted, onUnmounted, inject, App, InjectionKey, Ref, ComputedRef } from 'vue'
import { AtdashAuth } from '../AtdashAuth'
import { AtdashAuthConfig, AtdashSession, AtdashUser, LoginResult } from '../types'

export const ATDASH_AUTH_KEY: InjectionKey<AtdashAuth> = Symbol('atdash-auth')

export interface UseAtdashAuthReturn {
  // State
  session: Readonly<Ref<AtdashSession | null>>
  isAuthenticated: Readonly<ComputedRef<boolean>>
  user: Readonly<ComputedRef<AtdashUser | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  
  // Methods
  login: (identifier: string, password: string) => Promise<LoginResult>
  loginWithOAuth: (handle?: string) => Promise<LoginResult>
  logout: () => Promise<void>
  logoutEverywhere: () => Promise<void>
  refreshSession: () => Promise<boolean>
  checkSSO: () => Promise<AtdashSession | null>
}

export function useAtdashAuth(): UseAtdashAuthReturn {
  const auth = inject(ATDASH_AUTH_KEY)!
  
  if (!auth) {
    throw new Error(
      'AtdashAuth not found. Did you forget to install the plugin? ' +
      'Use app.use(createAtdashAuth(config)) in your main.js'
    )
  }

  // Reactive state
  const session = ref<AtdashSession | null>(auth.getSession())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const isAuthenticated = computed(() => !!session.value)
  
  const user = computed<AtdashUser | null>(() => {
    if (!session.value) return null
    
    return {
      did: session.value.did,
      handle: session.value.handle,
      email: session.value.email
    }
  })

  // Methods
  async function login(identifier: string, password: string): Promise<LoginResult> {
    loading.value = true
    error.value = null
    
    try {
      const result = await auth.login(identifier, password)
      
      if (result.success && result.session) {
        session.value = result.session
      } else {
        error.value = result.error || 'Login failed'
      }
      
      return result
    } finally {
      loading.value = false
    }
  }

  async function loginWithOAuth(handle?: string): Promise<LoginResult> {
    loading.value = true
    error.value = null
    
    try {
      const result = await auth.loginWithOAuth(handle)
      
      if (!result.success) {
        error.value = result.error || 'OAuth login failed'
      }
      
      return result
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    error.value = null
    
    try {
      await auth.logout()
      session.value = null
    } catch (err: any) {
      error.value = err.message || 'Logout failed'
    } finally {
      loading.value = false
    }
  }

  async function logoutEverywhere(): Promise<void> {
    loading.value = true
    error.value = null
    
    try {
      await auth.logoutEverywhere()
      session.value = null
    } catch (err: any) {
      error.value = err.message || 'Logout failed'
    } finally {
      loading.value = false
    }
  }

  async function refreshSession(): Promise<boolean> {
    loading.value = true
    error.value = null
    
    try {
      const success = await auth.refreshSession()
      
      if (success) {
        session.value = auth.getSession()
      } else {
        session.value = null
      }
      
      return success
    } catch (err: any) {
      error.value = err.message || 'Session refresh failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function checkSSO(): Promise<AtdashSession | null> {
    loading.value = true
    error.value = null
    
    try {
      const ssoSession = await auth.checkSSO()
      
      if (ssoSession) {
        session.value = ssoSession
      }
      
      return ssoSession
    } catch (err: any) {
      error.value = err.message || 'SSO check failed'
      return null
    } finally {
      loading.value = false
    }
  }

  // Setup listeners
  onMounted(() => {
    // Listen for session changes
    auth.on('session-change', (newSession: AtdashSession | null) => {
      session.value = newSession
    })
    
    // Check for SSO on mount
    checkSSO()
  })

  onUnmounted(() => {
    // Clean up listeners if component unmounts
    auth.off('session-change', (newSession: AtdashSession | null) => {
      session.value = newSession
    })
  })

  return {
    // State
    session: readonly(session),
    isAuthenticated: readonly(isAuthenticated),
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    
    // Methods
    login,
    loginWithOAuth,
    logout,
    logoutEverywhere,
    refreshSession,
    checkSSO
  }
}

// Vue plugin
export function createAtdashAuth(config: AtdashAuthConfig) {
  return {
    install(app: App) {
      const auth = new AtdashAuth(config)
      app.provide(ATDASH_AUTH_KEY, auth)
      
      // Also make available on global properties
      app.config.globalProperties.$atdashAuth = auth
    }
  }
}
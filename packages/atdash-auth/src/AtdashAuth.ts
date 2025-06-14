import { BskyAgent } from '@atproto/api'
import { 
  AtdashAuthConfig, 
  AtdashSession, 
  LoginResult, 
  AtdashUser,
  PDSInfo,
  AuthEvent
} from './types'
import { PDSDiscovery } from './PDSDiscovery'
import { 
  SessionStorage, 
  LocalStorageAdapter, 
  SessionStorageAdapter, 
  MemoryStorageAdapter 
} from './SessionStorage'
import { CrossDomainAuth } from './CrossDomainAuth'

export class AtdashAuth {
  private config: Required<AtdashAuthConfig>
  private agent: BskyAgent | null = null
  private pdsDiscovery: PDSDiscovery
  private sessionStorage: SessionStorage
  private crossDomainAuth: CrossDomainAuth
  private session: AtdashSession | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  constructor(config: AtdashAuthConfig) {
    // Set defaults
    this.config = {
      appId: config.appId,
      appName: config.appName,
      appUrl: config.appUrl || window.location.origin,
      redirectUri: config.redirectUri || `${window.location.origin}/auth/callback`,
      authServiceUrl: config.authServiceUrl || 'https://auth.atdash.app',
      allowedOrigins: config.allowedOrigins || ['*.atdash.app'],
      storage: config.storage || 'localStorage',
      debug: config.debug || false
    }

    // Initialize components
    this.pdsDiscovery = new PDSDiscovery(this.config.debug)
    this.sessionStorage = this.createStorage()
    this.crossDomainAuth = new CrossDomainAuth(
      this.config.allowedOrigins,
      this.config.debug
    )

    // Setup cross-domain auth
    this.setupCrossDomainAuth()
    
    // Load existing session
    this.initialize()
  }

  private createStorage(): SessionStorage {
    const adapters = {
      localStorage: new LocalStorageAdapter(),
      sessionStorage: new SessionStorageAdapter(),
      memory: new MemoryStorageAdapter()
    }
    
    return new SessionStorage(adapters[this.config.storage])
  }

  private async initialize(): Promise<void> {
    // Load session from storage
    const stored = await this.sessionStorage.getSession()
    if (stored) {
      await this.setSession(stored)
    }

    // Listen for auth events from other tabs
    this.crossDomainAuth.onMessage(async (event) => {
      switch (event.type) {
        case 'login':
          if (event.session) {
            await this.setSession(event.session)
          }
          break
        case 'logout':
          await this.clearSession()
          break
        case 'session-update':
          if (event.session) {
            await this.setSession(event.session)
          }
          break
      }
    })
  }

  private setupCrossDomainAuth(): void {
    // Setup auth bridge for cross-domain requests
    this.crossDomainAuth.setupAuthBridge(async () => {
      return this.session
    })
  }

  // Core authentication methods
  async login(identifier: string, password: string): Promise<LoginResult> {
    try {
      // Discover PDS
      const pdsInfo = await this.pdsDiscovery.fromHandle(identifier)
      
      // Create agent for the discovered PDS
      this.agent = new BskyAgent({ service: pdsInfo.service })
      
      // Attempt login
      const response = await this.agent.login({ identifier, password })
      const sessionData = response.data
      
      // Create atdash session
      const session: AtdashSession = {
        did: sessionData.did,
        handle: sessionData.handle,
        email: sessionData.email,
        accessJwt: sessionData.accessJwt,
        refreshJwt: sessionData.refreshJwt,
        pds: pdsInfo,
        apps: [this.config.appId]
      }
      
      await this.setSession(session)
      
      // Broadcast to other tabs/apps
      this.crossDomainAuth.broadcast({
        type: 'login',
        session,
        app: this.config.appId
      })
      
      return { success: true, session }
    } catch (error: any) {
      if (this.config.debug) {
        console.error('[AtdashAuth] Login failed:', error)
      }
      
      return { 
        success: false, 
        error: error.message || 'Login failed'
      }
    }
  }

  async loginWithOAuth(handle?: string): Promise<LoginResult> {
    try {
      if (handle) {
        const pdsInfo = await this.pdsDiscovery.fromHandle(handle)
        
        // OAuth is currently only supported by Bluesky
        if (pdsInfo.type === 'custom') {
          return {
            success: false,
            error: 'OAuth not supported for custom PDS. Please use password login.',
            requiresPassword: true
          }
        }
      }
      
      // Redirect to auth service
      const params = new URLSearchParams({
        client_id: this.config.appId,
        redirect_uri: this.config.redirectUri,
        app_name: this.config.appName,
        handle: handle || ''
      })
      
      window.location.href = `${this.config.authServiceUrl}/oauth?${params}`
      
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'OAuth login failed'
      }
    }
  }

  async handleOAuthCallback(code: string, state: string): Promise<LoginResult> {
    try {
      // Exchange code for session via auth service
      const response = await fetch(`${this.config.authServiceUrl}/api/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          state,
          client_id: this.config.appId,
          redirect_uri: this.config.redirectUri
        })
      })

      if (!response.ok) {
        throw new Error('Failed to exchange authorization code')
      }

      const data = await response.json()
      
      // Create session from response
      const session: AtdashSession = {
        did: data.did,
        handle: data.handle,
        email: data.email,
        accessJwt: data.access_token,
        refreshJwt: data.refresh_token,
        pds: data.pds || {
          service: 'https://bsky.social',
          type: 'bsky',
          authEndpoint: 'https://bsky.social/xrpc',
          apiEndpoint: 'https://bsky.social/xrpc'
        },
        apps: [this.config.appId]
      }

      await this.setSession(session)
      
      return { success: true, session }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'OAuth callback failed'
      }
    }
  }

  async logout(): Promise<void> {
    await this.clearSession()
    
    // Broadcast logout to other tabs/apps
    this.crossDomainAuth.broadcast({
      type: 'logout',
      app: this.config.appId
    })
  }

  async logoutEverywhere(): Promise<void> {
    // Call auth service to revoke all sessions
    if (this.session) {
      try {
        await fetch(`${this.config.authServiceUrl}/api/logout-everywhere`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.session.accessJwt}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            did: this.session.did
          })
        })
      } catch (error) {
        console.error('[AtdashAuth] Failed to logout everywhere:', error)
      }
    }
    
    await this.logout()
  }

  // Session management
  private async setSession(session: AtdashSession): Promise<void> {
    this.session = session
    
    // Create agent for the PDS
    if (session.pds) {
      this.agent = new BskyAgent({ service: session.pds.service })
      // @ts-ignore - session property exists on agent
      this.agent.session = {
        did: session.did,
        handle: session.handle,
        email: session.email,
        accessJwt: session.accessJwt,
        refreshJwt: session.refreshJwt
      }
    }
    
    // Add this app to the session
    if (!session.apps?.includes(this.config.appId)) {
      await this.sessionStorage.addApp(this.config.appId)
    }
    
    // Save to storage
    await this.sessionStorage.saveSession(session)
    
    // Emit event
    this.emit('session-change', session)
  }

  private async clearSession(): Promise<void> {
    this.session = null
    this.agent = null
    
    await this.sessionStorage.clearSession()
    
    this.emit('session-change', null)
  }

  async refreshSession(): Promise<boolean> {
    if (!this.session || !this.agent) {
      return false
    }

    try {
      const response = await this.agent.resumeSession({
        did: this.session.did,
        handle: this.session.handle,
        email: this.session.email,
        accessJwt: this.session.accessJwt,
        refreshJwt: this.session.refreshJwt,
        active: true
      } as any)
      
      // Update session with new tokens
      this.session.accessJwt = (response.data as any).accessJwt
      this.session.refreshJwt = (response.data as any).refreshJwt
      
      await this.sessionStorage.saveSession(this.session)
      
      return true
    } catch (error) {
      if (this.config.debug) {
        console.error('[AtdashAuth] Session refresh failed:', error)
      }
      
      await this.clearSession()
      return false
    }
  }

  // SSO methods
  async checkSSO(): Promise<AtdashSession | null> {
    // First check local storage
    if (this.session) {
      return this.session
    }

    // Try to get session from other atdash apps
    const atdashApps = [
      'https://chess.atdash.app',
      'https://music.atdash.app',
      'https://photos.atdash.app',
      this.config.authServiceUrl
    ].filter(url => url !== this.config.appUrl)

    const session = await this.crossDomainAuth.tryMultipleApps(atdashApps)
    
    if (session) {
      await this.setSession(session)
      return session
    }

    return null
  }

  // Getters
  getSession(): AtdashSession | null {
    return this.session
  }

  getAgent(): BskyAgent | null {
    return this.agent
  }

  isAuthenticated(): boolean {
    return !!this.session
  }

  getUser(): AtdashUser | null {
    if (!this.session) return null
    
    return {
      did: this.session.did,
      handle: this.session.handle,
      email: this.session.email
    }
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback)
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[AtdashAuth] Event handler error:`, error)
      }
    })
  }

  // Cleanup
  destroy(): void {
    this.crossDomainAuth.close()
    this.listeners.clear()
  }
}
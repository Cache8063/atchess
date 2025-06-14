import { BroadcastChannel } from 'broadcast-channel'
import { AtdashSession, AuthEvent } from './types'

export class CrossDomainAuth {
  private allowedOrigins: string[]
  private channel: BroadcastChannel<AuthEvent>
  private debug: boolean

  constructor(allowedOrigins: string[] = [], debug = false) {
    this.allowedOrigins = allowedOrigins
    this.debug = debug
    
    // BroadcastChannel for same-origin tabs
    this.channel = new BroadcastChannel('atdash_auth')
  }

  // Broadcast auth events to other tabs/windows
  broadcast(event: AuthEvent): void {
    if (this.debug) {
      console.log('[CrossDomainAuth] Broadcasting:', event.type)
    }
    this.channel.postMessage(event)
  }

  // Listen for auth events from other tabs/windows
  onMessage(callback: (event: AuthEvent) => void): () => void {
    const handler = (event: AuthEvent) => {
      if (this.debug) {
        console.log('[CrossDomainAuth] Received:', event.type)
      }
      callback(event)
    }

    this.channel.addEventListener('message', handler)
    
    // Return cleanup function
    return () => {
      this.channel.removeEventListener('message', handler)
    }
  }

  // Request auth from another app via iframe
  async requestAuthFromApp(targetAppUrl: string): Promise<AtdashSession | null> {
    return new Promise((resolve, reject) => {
      // Validate target app
      if (!this.isAllowedOrigin(targetAppUrl)) {
        reject(new Error(`Origin not allowed: ${targetAppUrl}`))
        return
      }

      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = `${targetAppUrl}/auth/bridge`

      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error('Auth request timeout'))
      }, 10000)

      const cleanup = () => {
        clearTimeout(timeout)
        window.removeEventListener('message', handler)
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
      }

      const handler = (event: MessageEvent) => {
        // Validate origin
        if (!this.isAllowedOrigin(event.origin)) {
          return
        }

        if (event.data?.type === 'atdash:auth:response') {
          cleanup()
          
          if (event.data.session) {
            resolve(event.data.session)
          } else {
            resolve(null)
          }
        }
      }

      window.addEventListener('message', handler)
      document.body.appendChild(iframe)

      // Request auth after iframe loads
      iframe.onload = () => {
        iframe.contentWindow?.postMessage(
          { 
            type: 'atdash:auth:request',
            app: window.location.origin,
            timestamp: Date.now()
          },
          targetAppUrl
        )
      }

      iframe.onerror = () => {
        cleanup()
        reject(new Error('Failed to load auth bridge'))
      }
    })
  }

  // Handle auth requests when this app acts as the provider
  setupAuthBridge(getSession: () => Promise<AtdashSession | null>): void {
    const handler = async (event: MessageEvent) => {
      // Validate origin
      if (!this.isAllowedOrigin(event.origin)) {
        return
      }

      if (event.data?.type === 'atdash:auth:request') {
        if (this.debug) {
          console.log('[CrossDomainAuth] Auth request from:', event.origin)
        }

        try {
          const session = await getSession()
          
          event.source?.postMessage(
            {
              type: 'atdash:auth:response',
              session,
              timestamp: Date.now()
            },
            event.origin as any
          )
        } catch (error) {
          event.source?.postMessage(
            {
              type: 'atdash:auth:response',
              session: null,
              error: 'Failed to get session',
              timestamp: Date.now()
            },
            event.origin as any
          )
        }
      }
    }

    window.addEventListener('message', handler)
  }

  // Try to get session from multiple apps
  async tryMultipleApps(appUrls: string[]): Promise<AtdashSession | null> {
    const validApps = appUrls.filter(url => this.isAllowedOrigin(url))
    
    if (this.debug) {
      console.log('[CrossDomainAuth] Trying apps:', validApps)
    }

    // Try each app in parallel with a race condition
    const promises = validApps.map(appUrl => 
      this.requestAuthFromApp(appUrl).catch(() => null)
    )

    const results = await Promise.all(promises)
    
    // Return the first valid session
    return results.find(session => session !== null) || null
  }

  private isAllowedOrigin(origin: string): boolean {
    // Always allow same origin
    if (origin === window.location.origin) {
      return true
    }

    // Check against allowed origins list
    try {
      const url = new URL(origin)
      return this.allowedOrigins.some(allowed => {
        if (allowed === '*') return true
        if (allowed === origin) return true
        
        // Support wildcard subdomains (*.atdash.app)
        if (allowed.startsWith('*.')) {
          const domain = allowed.slice(2)
          return url.hostname.endsWith(domain)
        }
        
        return false
      })
    } catch {
      return false
    }
  }

  close(): void {
    this.channel.close()
  }
}
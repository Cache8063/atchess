import { AtdashSession } from './types'

export interface StorageAdapter {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
}

export class LocalStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    return localStorage.getItem(key)
  }

  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value)
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key)
  }

  async clear(): Promise<void> {
    localStorage.clear()
  }
}

export class SessionStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    return sessionStorage.getItem(key)
  }

  async set(key: string, value: string): Promise<void> {
    sessionStorage.setItem(key, value)
  }

  async remove(key: string): Promise<void> {
    sessionStorage.removeItem(key)
  }

  async clear(): Promise<void> {
    sessionStorage.clear()
  }
}

export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>()

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value)
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    this.store.clear()
  }
}

export class SessionStorage {
  private adapter: StorageAdapter
  private readonly SESSION_KEY = 'atdash_session'
  private readonly PDS_KEY = 'atdash_pds'
  private readonly APPS_KEY = 'atdash_apps'

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter
  }

  async saveSession(session: AtdashSession): Promise<void> {
    const sessionData = {
      ...session,
      savedAt: Date.now()
    }
    await this.adapter.set(this.SESSION_KEY, JSON.stringify(sessionData))
  }

  async getSession(): Promise<AtdashSession | null> {
    try {
      const data = await this.adapter.get(this.SESSION_KEY)
      if (!data) return null

      const sessionData = JSON.parse(data)
      
      // Check if session is not too old (24 hours)
      const age = Date.now() - (sessionData.savedAt || 0)
      if (age > 24 * 60 * 60 * 1000) {
        await this.clearSession()
        return null
      }

      // Remove internal fields
      delete sessionData.savedAt
      
      return sessionData as AtdashSession
    } catch (error) {
      console.error('[SessionStorage] Failed to load session:', error)
      return null
    }
  }

  async clearSession(): Promise<void> {
    await this.adapter.remove(this.SESSION_KEY)
    await this.adapter.remove(this.PDS_KEY)
  }

  async addApp(appId: string): Promise<void> {
    const session = await this.getSession()
    if (session) {
      const apps = session.apps || []
      if (!apps.includes(appId)) {
        apps.push(appId)
        session.apps = apps
        await this.saveSession(session)
      }
    }
  }

  async getApps(): Promise<string[]> {
    const session = await this.getSession()
    return session?.apps || []
  }

  async isValid(): Promise<boolean> {
    const session = await this.getSession()
    if (!session) return false

    // Check if tokens exist
    if (!session.accessJwt || !session.refreshJwt) return false

    // Check if expired (if we have expiry info)
    if (session.expiresAt && Date.now() > session.expiresAt) return false

    return true
  }
}
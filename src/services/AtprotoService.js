import { BskyAgent } from '@atproto/api'
import { PDSDiscovery } from './PDSDiscovery'

class AtprotoService {
  constructor() {
    this.agent = null
    this.session = null
    this.pdsInfo = null
    this.pdsDiscovery = new PDSDiscovery()
    this.CLIENT_ID = 'com.chess.app'
    this.REDIRECT_URI = window.location.origin + '/auth/callback'
  }

  async login(identifier, password) {
    try {
      // Discover PDS from handle
      this.pdsInfo = await this.pdsDiscovery.fromHandle(identifier)
      
      // Create agent for the discovered PDS
      this.agent = new BskyAgent({ service: this.pdsInfo.service })
      
      // Attempt login
      const response = await this.agent.login({ identifier, password })
      this.session = response.data
      
      // Save session with PDS info
      this.saveSession()
      
      return { success: true, did: this.session.did, pds: this.pdsInfo }
    } catch (error) {
      // If custom PDS fails, try Bluesky as fallback
      if (this.pdsInfo?.type === 'custom') {
        try {
          this.pdsInfo = {
            service: 'https://bsky.social',
            type: 'bsky',
            authEndpoint: 'https://bsky.social/xrpc',
            apiEndpoint: 'https://bsky.social/xrpc'
          }
          this.agent = new BskyAgent({ service: this.pdsInfo.service })
          const response = await this.agent.login({ identifier, password })
          this.session = response.data
          this.saveSession()
          return { success: true, did: this.session.did, pds: this.pdsInfo }
        } catch (fallbackError) {
          return { success: false, error: fallbackError.message }
        }
      }
      
      return { success: false, error: error.message }
    }
  }

  async createSession(handle) {
    const state = this.generateState()
    localStorage.setItem('oauth_state', state)
    
    // Discover PDS if handle provided
    if (handle) {
      this.pdsInfo = await this.pdsDiscovery.fromHandle(handle)
      localStorage.setItem('pending_pds', JSON.stringify(this.pdsInfo))
    } else {
      // Default to Bluesky
      this.pdsInfo = {
        service: 'https://bsky.social',
        type: 'bsky',
        authEndpoint: 'https://bsky.social/xrpc'
      }
    }
    
    // OAuth is currently only supported by Bluesky
    // For custom PDS, we'll need to use password auth
    if (this.pdsInfo.type === 'custom') {
      return { 
        success: false, 
        error: 'OAuth not supported for custom PDS. Please use password login.',
        requiresPassword: true 
      }
    }
    
    const authUrl = `https://bsky.social/oauth/authorize?` +
      `client_id=${this.CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&` +
      `scope=read write&` +
      `response_type=code&` +
      `state=${state}`
    
    window.location.href = authUrl
  }

  async handleOAuthCallback(code, state) {
    const savedState = localStorage.getItem('oauth_state')
    
    if (state !== savedState) {
      return { success: false, error: 'Invalid state parameter' }
    }
    
    localStorage.removeItem('oauth_state')
    
    try {
      // Exchange code for tokens
      const response = await fetch('https://bsky.social/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.REDIRECT_URI,
          client_id: this.CLIENT_ID
        })
      })
      
      const data = await response.json()
      
      if (data.access_token) {
        // Create session with token
        this.session = {
          accessJwt: data.access_token,
          refreshJwt: data.refresh_token,
          handle: data.handle,
          did: data.did
        }
        
        this.agent.session = this.session
        this.saveSession()
        
        return { success: true, did: data.did }
      }
      
      return { success: false, error: 'Failed to exchange code' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async refreshSession() {
    if (!this.session?.refreshJwt) return false
    
    try {
      const response = await this.agent.resumeSession(this.session)
      this.session = response.data
      this.saveSession()
      return true
    } catch {
      return false
    }
  }

  async getProfile(did) {
    try {
      const response = await this.agent.api.app.bsky.actor.getProfile({ 
        actor: did 
      })
      
      const profile = response.data
      
      // Fetch chess profile
      const chessProfile = await this.getRecord(did, 'com.chess.profile', 'self')
      
      return {
        ...profile,
        chess: chessProfile
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      return null
    }
  }

  async createGame(gameData) {
    const record = {
      $type: 'com.chess.game.record',
      white: gameData.white,
      black: gameData.black,
      pgn: gameData.pgn,
      result: gameData.result,
      timeControl: gameData.timeControl,
      rated: gameData.rated,
      opening: gameData.opening,
      eco: gameData.eco,
      createdAt: new Date().toISOString(),
      completedAt: gameData.completedAt || new Date().toISOString(),
      moves: gameData.moves
    }

    try {
      const response = await this.agent.api.com.atproto.repo.createRecord({
        repo: this.session.did,
        collection: 'com.chess.game',
        record
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to create game record:', error)
      throw error
    }
  }

  async updateStats(stats) {
    const record = {
      $type: 'com.chess.profile.record',
      elo: stats.elo,
      games: stats.games,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      peak: stats.peak,
      lastActive: new Date().toISOString(),
      preferences: stats.preferences || {}
    }

    try {
      const existing = await this.getRecord(this.session.did, 'com.chess.profile', 'self')
      
      if (existing) {
        await this.agent.api.com.atproto.repo.putRecord({
          repo: this.session.did,
          collection: 'com.chess.profile',
          rkey: 'self',
          record
        })
      } else {
        await this.agent.api.com.atproto.repo.createRecord({
          repo: this.session.did,
          collection: 'com.chess.profile',
          rkey: 'self',
          record
        })
      }
    } catch (error) {
      console.error('Failed to update stats:', error)
      throw error
    }
  }

  async createChallenge(challengedDid, options) {
    const record = {
      $type: 'com.chess.challenge.record',
      challenger: this.session.did,
      challenged: challengedDid,
      timeControl: options.timeControl,
      rated: options.rated ?? true,
      color: options.color || 'random',
      status: 'pending',
      message: options.message,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    try {
      const response = await this.agent.api.com.atproto.repo.createRecord({
        repo: this.session.did,
        collection: 'com.chess.challenge',
        record
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to create challenge:', error)
      throw error
    }
  }

  async getGames(did, limit = 20) {
    try {
      const response = await this.agent.api.com.atproto.repo.listRecords({
        repo: did,
        collection: 'com.chess.game',
        limit
      })
      
      return response.data.records
    } catch (error) {
      console.error('Failed to fetch games:', error)
      return []
    }
  }

  async shareGame(gameUri, message) {
    const post = {
      $type: 'app.bsky.feed.post',
      text: message || 'Check out this chess game!',
      embed: {
        $type: 'app.bsky.embed.external',
        external: {
          uri: `${window.location.origin}/game/${gameUri}`,
          title: 'Chess Game',
          description: 'View and analyze this chess game'
        }
      },
      createdAt: new Date().toISOString()
    }

    try {
      await this.agent.api.app.bsky.feed.post.create(
        { repo: this.session.did },
        post
      )
    } catch (error) {
      console.error('Failed to share game:', error)
    }
  }

  async getRecord(did, collection, rkey) {
    try {
      const response = await this.agent.api.com.atproto.repo.getRecord({
        repo: did,
        collection,
        rkey
      })
      return response.data.value
    } catch {
      return null
    }
  }

  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  saveSession() {
    if (this.session) {
      const sessionData = {
        session: this.session,
        pds: this.pdsInfo,
        savedAt: Date.now()
      }
      localStorage.setItem('atproto_session', JSON.stringify(sessionData))
    }
  }

  loadSession() {
    const saved = localStorage.getItem('atproto_session')
    if (saved) {
      try {
        const sessionData = JSON.parse(saved)
        
        // Check if session is not too old (24 hours)
        const age = Date.now() - (sessionData.savedAt || 0)
        if (age > 24 * 60 * 60 * 1000) {
          this.clearSession()
          return false
        }
        
        this.session = sessionData.session
        this.pdsInfo = sessionData.pds || {
          service: 'https://bsky.social',
          type: 'bsky',
          authEndpoint: 'https://bsky.social/xrpc',
          apiEndpoint: 'https://bsky.social/xrpc'
        }
        
        // Recreate agent with correct PDS
        this.agent = new BskyAgent({ service: this.pdsInfo.service })
        this.agent.session = this.session
        
        return true
      } catch {
        return false
      }
    }
    return false
  }

  clearSession() {
    localStorage.removeItem('atproto_session')
    localStorage.removeItem('pending_pds')
  }

  logout() {
    this.session = null
    this.pdsInfo = null
    if (this.agent) {
      this.agent.session = null
    }
    this.clearSession()
  }
}

export default AtprotoService
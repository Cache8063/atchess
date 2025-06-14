import { BskyAgent } from '@atproto/api'

class AtprotoService {
  constructor() {
    this.agent = new BskyAgent({ service: 'https://bsky.social' })
    this.session = null
    this.CLIENT_ID = 'com.chess.app'
    this.REDIRECT_URI = window.location.origin + '/auth/callback'
  }

  async login(identifier, password) {
    try {
      const response = await this.agent.login({ identifier, password })
      this.session = response.data
      this.saveSession()
      return { success: true, did: this.session.did }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async createSession() {
    const state = this.generateState()
    localStorage.setItem('oauth_state', state)
    
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
      localStorage.setItem('atproto_session', JSON.stringify(this.session))
    }
  }

  loadSession() {
    const saved = localStorage.getItem('atproto_session')
    if (saved) {
      try {
        this.session = JSON.parse(saved)
        this.agent.session = this.session
        return true
      } catch {
        return false
      }
    }
    return false
  }

  logout() {
    this.session = null
    this.agent.session = null
    localStorage.removeItem('atproto_session')
  }
}

export default AtprotoService
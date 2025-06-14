import { defineStore } from 'pinia'
import AtprotoService from '@/services/AtprotoService'

export const useUserStore = defineStore('user', {
  state: () => ({
    did: null,
    handle: null,
    displayName: null,
    avatar: null,
    elo: 1500,
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    peak: 1500,
    title: '',
    country: '',
    preferences: {
      timeControl: 'Rapid 10+0',
      pieceSet: 'standard',
      board: 'green',
      autoQueen: true,
      confirmMove: false,
      sound: true
    },
    isAuthenticated: false,
    atprotoService: new AtprotoService()
  }),

  getters: {
    winRate() {
      if (this.games === 0) return 0
      return Math.round((this.wins / this.games) * 100)
    },
    
    record() {
      return `${this.wins}-${this.losses}-${this.draws}`
    },
    
    rating() {
      return this.elo
    },
    
    profileUrl() {
      return this.handle ? `/profile/${this.handle}` : null
    }
  },

  actions: {
    async login(identifier, password) {
      try {
        const result = await this.atprotoService.login(identifier, password)
        
        if (result.success) {
          await this.loadProfile(result.did)
          this.isAuthenticated = true
          return { success: true }
        }
        
        return { success: false, error: result.error }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },
    
    async loginWithOAuth(handle) {
      return await this.atprotoService.createSession(handle)
    },
    
    async handleOAuthCallback(code, state) {
      try {
        const result = await this.atprotoService.handleOAuthCallback(code, state)
        if (result.success) {
          await this.loadProfile(result.did)
          this.isAuthenticated = true
          return { success: true }
        }
        return { success: false, error: result.error }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },
    
    async logout() {
      this.atprotoService.logout()
      this.resetUser()
    },
    
    async loadProfile(did) {
      try {
        const profile = await this.atprotoService.getProfile(did)
        
        if (profile) {
          this.did = did
          this.handle = profile.handle
          this.displayName = profile.displayName || profile.handle
          this.avatar = profile.avatar
          
          if (profile.chess) {
            this.elo = profile.chess.elo || 1500
            this.games = profile.chess.games || 0
            this.wins = profile.chess.wins || 0
            this.losses = profile.chess.losses || 0
            this.draws = profile.chess.draws || 0
            this.peak = profile.chess.peak || this.elo
            this.title = profile.chess.title || ''
            this.country = profile.chess.country || ''
            this.preferences = { ...this.preferences, ...profile.chess.preferences }
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
      }
    },
    
    async updateStats(gameResult, opponentElo) {
      const oldElo = this.elo
      
      this.games++
      
      if (gameResult === 'win') {
        this.wins++
        this.elo = this.calculateNewElo(oldElo, opponentElo, 1)
      } else if (gameResult === 'loss') {
        this.losses++
        this.elo = this.calculateNewElo(oldElo, opponentElo, 0)
      } else {
        this.draws++
        this.elo = this.calculateNewElo(oldElo, opponentElo, 0.5)
      }
      
      if (this.elo > this.peak) {
        this.peak = this.elo
      }
      
      await this.saveStats()
    },
    
    calculateNewElo(playerElo, opponentElo, score, kFactor = 32) {
      const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
      const newElo = playerElo + kFactor * (score - expectedScore)
      return Math.round(Math.max(100, newElo))
    },
    
    async saveStats() {
      if (!this.isAuthenticated) return
      
      try {
        await this.atprotoService.updateStats({
          elo: this.elo,
          games: this.games,
          wins: this.wins,
          losses: this.losses,
          draws: this.draws,
          peak: this.peak,
          preferences: this.preferences
        })
      } catch (error) {
        console.error('Failed to save stats:', error)
      }
    },
    
    async updatePreferences(preferences) {
      this.preferences = { ...this.preferences, ...preferences }
      await this.saveStats()
    },
    
    async checkSession() {
      try {
        const hasSession = this.atprotoService.loadSession()
        
        if (hasSession) {
          const refreshed = await this.atprotoService.refreshSession()
          
          if (refreshed) {
            const session = this.atprotoService.session
            await this.loadProfile(session.did)
            this.isAuthenticated = true
            return true
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
      }
      
      return false
    },
    
    resetUser() {
      this.did = null
      this.handle = null
      this.displayName = null
      this.avatar = null
      this.elo = 1500
      this.games = 0
      this.wins = 0
      this.losses = 0
      this.draws = 0
      this.peak = 1500
      this.title = ''
      this.country = ''
      this.isAuthenticated = false
    }
  }
})
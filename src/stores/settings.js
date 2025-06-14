import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'dark',
    boardTheme: 'green',
    pieceSet: 'standard',
    moveAnimation: true,
    animationSpeed: 200,
    highlightLastMove: true,
    highlightValidMoves: true,
    autoPromoteToQueen: true,
    confirmMove: false,
    showCoordinates: true,
    showCapturedPieces: true,
    showMoveHistory: true,
    soundEnabled: true,
    soundVolume: 0.5,
    clockPosition: 'side', // side or bottom
    notation: 'san', // san or uci
    language: 'en'
  }),

  getters: {
    isDarkTheme() {
      return this.theme === 'dark'
    },
    
    boardColors() {
      const themes = {
        green: {
          light: '#e8e6d1',
          dark: '#2d4a2b'
        },
        brown: {
          light: '#f0d9b5',
          dark: '#b58863'
        },
        blue: {
          light: '#dee3e6',
          dark: '#4b7399'
        },
        purple: {
          light: '#efe6f7',
          dark: '#7b61a6'
        }
      }
      
      return themes[this.boardTheme] || themes.green
    }
  },

  actions: {
    updateSettings(settings) {
      Object.assign(this, settings)
      this.saveToLocalStorage()
    },
    
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark')
      this.saveToLocalStorage()
    },
    
    setBoardTheme(theme) {
      this.boardTheme = theme
      this.saveToLocalStorage()
    },
    
    setPieceSet(set) {
      this.pieceSet = set
      this.saveToLocalStorage()
    },
    
    toggleSound() {
      this.soundEnabled = !this.soundEnabled
      this.saveToLocalStorage()
    },
    
    setSoundVolume(volume) {
      this.soundVolume = Math.max(0, Math.min(1, volume))
      this.saveToLocalStorage()
    },
    
    toggleMoveAnimation() {
      this.moveAnimation = !this.moveAnimation
      this.saveToLocalStorage()
    },
    
    setAnimationSpeed(speed) {
      this.animationSpeed = speed
      this.saveToLocalStorage()
    },
    
    loadFromLocalStorage() {
      const saved = localStorage.getItem('chessSettings')
      
      if (saved) {
        try {
          const settings = JSON.parse(saved)
          Object.assign(this, settings)
          
          if (this.theme === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      }
    },
    
    saveToLocalStorage() {
      try {
        localStorage.setItem('chessSettings', JSON.stringify(this.$state))
      } catch (error) {
        console.error('Failed to save settings:', error)
      }
    },
    
    resetToDefaults() {
      this.$reset()
      this.saveToLocalStorage()
    }
  }
})
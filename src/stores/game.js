import { defineStore } from 'pinia'
import { ChessEngine } from '@/engine/ChessEngine'
import { GameState } from '@/engine/GameState'
import { useUserStore } from './user'

export const useGameStore = defineStore('game', {
  state: () => ({
    engine: new ChessEngine(),
    gameState: new GameState(),
    selectedSquare: null,
    validMoves: [],
    orientation: 'white',
    autoPromote: true,
    showMoveHints: true,
    soundEnabled: true,
    analysisMode: false,
    variation: null
  }),

  getters: {
    board() {
      return this.engine.getBoard()
    },
    
    currentTurn() {
      return this.engine.getTurn()
    },
    
    isMyTurn() {
      const userStore = useUserStore()
      if (!userStore.isAuthenticated) return true
      
      if (this.gameState.white === userStore.did) {
        return this.currentTurn === 'white'
      } else if (this.gameState.black === userStore.did) {
        return this.currentTurn === 'black'
      }
      
      return false
    },
    
    gameStatus() {
      return this.engine.getGameStatus()
    },
    
    moveHistory() {
      return this.engine.getHistory()
    },
    
    capturedPieces() {
      return this.engine.getCapturedPieces()
    },
    
    fen() {
      return this.engine.getFen()
    },
    
    pgn() {
      return this.engine.getPgn()
    },
    
    lastMove() {
      return this.engine.lastMove
    },
    
    isCheck() {
      return this.engine.isCheck()
    },
    
    isGameOver() {
      return this.engine.isGameOver()
    },
    
    whiteTime() {
      return this.gameState.getCurrentPlayerTime('white')
    },
    
    blackTime() {
      return this.gameState.getCurrentPlayerTime('black')
    }
  },

  actions: {
    newGame(config = {}) {
      this.engine.reset(config.fen)
      this.gameState.initialize(config)
      this.selectedSquare = null
      this.validMoves = []
      this.orientation = config.orientation || 'white'
      
      if (config.start) {
        this.gameState.start()
      }
    },
    
    selectSquare(square) {
      if (this.analysisMode && !this.isMyTurn) return
      
      const piece = this.engine.getPiece(square)
      
      if (this.selectedSquare === square) {
        this.clearSelection()
        return
      }
      
      if (this.selectedSquare && this.validMoves.includes(square)) {
        this.makeMove(this.selectedSquare, square)
        return
      }
      
      if (piece && piece.color === this.currentTurn[0]) {
        this.selectedSquare = square
        this.validMoves = this.showMoveHints ? this.engine.getValidMoves(square) : []
      } else {
        this.clearSelection()
      }
    },
    
    makeMove(from, to, promotion = 'q') {
      const move = this.engine.makeMove(from, to, promotion)
      
      if (move) {
        this.clearSelection()
        
        if (this.gameState.status === 'playing') {
          this.gameState.updateTime(move.color === 'w' ? 'white' : 'black')
        }
        
        if (this.soundEnabled) {
          this.playMoveSound(move)
        }
        
        if (this.engine.isGameOver()) {
          this.handleGameEnd()
        }
        
        return move
      }
      
      return null
    },
    
    makeMoveUCI(uci) {
      const from = uci.substring(0, 2)
      const to = uci.substring(2, 4)
      const promotion = uci.length > 4 ? uci[4] : undefined
      return this.makeMove(from, to, promotion)
    },
    
    undoMove() {
      const move = this.engine.undoMove()
      if (move) {
        this.clearSelection()
      }
      return move
    },
    
    clearSelection() {
      this.selectedSquare = null
      this.validMoves = []
    },
    
    flipBoard() {
      this.orientation = this.orientation === 'white' ? 'black' : 'white'
    },
    
    startClock() {
      if (this.gameState.status === 'waiting') {
        this.gameState.start()
      }
    },
    
    pauseGame() {
      this.gameState.pause()
    },
    
    resumeGame() {
      this.gameState.resume()
    },
    
    resign(color) {
      const result = color === 'white' ? '0-1' : '1-0'
      this.gameState.finish(result)
    },
    
    offerDraw() {
      // Implement draw offer logic
    },
    
    acceptDraw() {
      this.gameState.finish('1/2-1/2')
    },
    
    handleGameEnd() {
      const status = this.gameStatus
      
      if (status.status === 'checkmate') {
        this.gameState.finish(status.winner === 'white' ? '1-0' : '0-1')
      } else if (status.status === 'stalemate' || status.status === 'draw') {
        this.gameState.finish('1/2-1/2')
      }
    },
    
    loadPgn(pgn) {
      if (this.engine.loadPgn(pgn)) {
        this.clearSelection()
        return true
      }
      return false
    },
    
    loadFen(fen) {
      this.engine.reset(fen)
      this.clearSelection()
    },
    
    enterAnalysisMode() {
      this.analysisMode = true
      this.variation = this.engine.clone()
    },
    
    exitAnalysisMode() {
      this.analysisMode = false
      this.variation = null
    },
    
    playMoveSound(move) {
      // Implement sound playing logic
      const audio = new Audio()
      if (move.captured) {
        audio.src = '/sounds/capture.mp3'
      } else if (this.engine.isCheck()) {
        audio.src = '/sounds/check.mp3'
      } else {
        audio.src = '/sounds/move.mp3'
      }
      audio.play().catch(() => {})
    },
    
    toggleSound() {
      this.soundEnabled = !this.soundEnabled
    },
    
    toggleMoveHints() {
      this.showMoveHints = !this.showMoveHints
      if (!this.showMoveHints) {
        this.validMoves = []
      } else if (this.selectedSquare) {
        this.validMoves = this.engine.getValidMoves(this.selectedSquare)
      }
    }
  }
})
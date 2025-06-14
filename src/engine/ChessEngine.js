import { Chess } from 'chess.js'
import { INITIAL_FEN } from '@/utils/constants'

export class ChessEngine {
  constructor(fen = INITIAL_FEN) {
    this.game = new Chess(fen)
    this.history = []
    this.capturedPieces = { white: [], black: [] }
    this.lastMove = null
  }

  reset(fen = INITIAL_FEN) {
    this.game = new Chess(fen)
    this.history = []
    this.capturedPieces = { white: [], black: [] }
    this.lastMove = null
  }

  makeMove(from, to, promotion = 'q') {
    try {
      const move = this.game.move({ from, to, promotion })
      if (move) {
        this.history.push(move)
        this.lastMove = { from, to }
        
        if (move.captured) {
          const capturedColor = move.color === 'w' ? 'black' : 'white'
          this.capturedPieces[capturedColor].push(move.captured)
        }
        
        return move
      }
      return null
    } catch (error) {
      return null
    }
  }

  makeMoveUCI(uci) {
    const from = uci.substring(0, 2)
    const to = uci.substring(2, 4)
    const promotion = uci.length > 4 ? uci[4] : undefined
    return this.makeMove(from, to, promotion)
  }

  undoMove() {
    const move = this.game.undo()
    if (move) {
      this.history.pop()
      this.lastMove = this.history.length > 0 
        ? { from: this.history[this.history.length - 1].from, to: this.history[this.history.length - 1].to }
        : null
        
      if (move.captured) {
        const capturedColor = move.color === 'w' ? 'black' : 'white'
        this.capturedPieces[capturedColor].pop()
      }
      
      return move
    }
    return null
  }

  getValidMoves(square) {
    const moves = this.game.moves({ square, verbose: true })
    return moves.map(move => move.to)
  }

  getAllValidMoves() {
    return this.game.moves({ verbose: true })
  }

  isValidMove(from, to) {
    const moves = this.getValidMoves(from)
    return moves.includes(to)
  }

  isCheck() {
    return this.game.isCheck()
  }

  isCheckmate() {
    return this.game.isCheckmate()
  }

  isDraw() {
    return this.game.isDraw()
  }

  isStalemate() {
    return this.game.isStalemate()
  }

  isThreefoldRepetition() {
    return this.game.isThreefoldRepetition()
  }

  isInsufficientMaterial() {
    return this.game.isInsufficientMaterial()
  }

  isGameOver() {
    return this.game.isGameOver()
  }

  getTurn() {
    return this.game.turn() === 'w' ? 'white' : 'black'
  }

  getFen() {
    return this.game.fen()
  }

  getPgn() {
    return this.game.pgn()
  }

  loadPgn(pgn) {
    try {
      this.game.loadPgn(pgn)
      this.updateHistoryFromGame()
      return true
    } catch (error) {
      return false
    }
  }

  getBoard() {
    return this.game.board()
  }

  getPiece(square) {
    return this.game.get(square)
  }

  getHistory() {
    return this.game.history({ verbose: true })
  }

  getMoveCount() {
    return Math.floor(this.history.length / 2) + 1
  }

  getCapturedPieces() {
    return this.capturedPieces
  }

  getGameStatus() {
    if (this.isCheckmate()) {
      return {
        status: 'checkmate',
        winner: this.getTurn() === 'white' ? 'black' : 'white'
      }
    }
    
    if (this.isStalemate()) {
      return { status: 'stalemate', winner: null }
    }
    
    if (this.isDraw()) {
      if (this.isThreefoldRepetition()) {
        return { status: 'threefold_repetition', winner: null }
      }
      if (this.isInsufficientMaterial()) {
        return { status: 'insufficient_material', winner: null }
      }
      return { status: 'draw', winner: null }
    }
    
    if (this.isCheck()) {
      return { status: 'check', winner: null }
    }
    
    return { status: 'playing', winner: null }
  }

  getKingSquare(color) {
    const board = this.getBoard()
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece && piece.type === 'k' && piece.color === color[0]) {
          return String.fromCharCode(97 + file) + (8 - rank)
        }
      }
    }
    return null
  }

  getAttackedSquares(color) {
    const attacked = new Set()
    const board = this.getBoard()
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece && piece.color === color[0]) {
          const square = String.fromCharCode(97 + file) + (8 - rank)
          const moves = this.game.moves({ square, verbose: true })
          moves.forEach(move => attacked.add(move.to))
        }
      }
    }
    
    return Array.from(attacked)
  }

  updateHistoryFromGame() {
    this.history = this.game.history({ verbose: true })
    this.capturedPieces = { white: [], black: [] }
    
    this.history.forEach(move => {
      if (move.captured) {
        const capturedColor = move.color === 'w' ? 'black' : 'white'
        this.capturedPieces[capturedColor].push(move.captured)
      }
    })
    
    if (this.history.length > 0) {
      const lastMove = this.history[this.history.length - 1]
      this.lastMove = { from: lastMove.from, to: lastMove.to }
    }
  }

  clone() {
    const cloned = new ChessEngine(this.getFen())
    cloned.history = [...this.history]
    cloned.capturedPieces = {
      white: [...this.capturedPieces.white],
      black: [...this.capturedPieces.black]
    }
    cloned.lastMove = this.lastMove ? { ...this.lastMove } : null
    return cloned
  }
}
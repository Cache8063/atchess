import { PIECE_VALUES } from '@/utils/constants'

export class AIPlayer {
  constructor(level = 1) {
    this.level = level
    this.maxDepth = this.getMaxDepth()
    this.randomness = this.getRandomness()
  }

  getMaxDepth() {
    const depths = [1, 3, 4, 6, 8]
    return depths[this.level - 1] || 3
  }

  getRandomness() {
    const randomness = [0.8, 0.3, 0.1, 0.05, 0]
    return randomness[this.level - 1] || 0.3
  }

  async getBestMove(engine) {
    // For beginner level, use more random moves
    if (this.level === 1 && Math.random() < this.randomness) {
      return this.getRandomMove(engine)
    }

    const moves = engine.getAllValidMoves()
    if (moves.length === 0) return null

    // For higher levels, use minimax with alpha-beta pruning
    let bestMove = null
    let bestScore = -Infinity

    for (const move of moves) {
      engine.makeMove(move.from, move.to, move.promotion)
      const score = -this.minimax(engine, this.maxDepth - 1, -Infinity, Infinity, false)
      engine.undoMove()

      // Add some randomness for lower levels
      const adjustedScore = score + (Math.random() - 0.5) * this.randomness * 100

      if (adjustedScore > bestScore) {
        bestScore = adjustedScore
        bestMove = move
      }
    }

    return bestMove
  }

  getRandomMove(engine) {
    const moves = engine.getAllValidMoves()
    if (moves.length === 0) return null
    return moves[Math.floor(Math.random() * moves.length)]
  }

  minimax(engine, depth, alpha, beta, maximizing) {
    if (depth === 0 || engine.isGameOver()) {
      return this.evaluate(engine)
    }

    const moves = engine.getAllValidMoves()
    
    if (maximizing) {
      let maxScore = -Infinity
      for (const move of moves) {
        engine.makeMove(move.from, move.to, move.promotion)
        const score = this.minimax(engine, depth - 1, alpha, beta, false)
        engine.undoMove()
        
        maxScore = Math.max(maxScore, score)
        alpha = Math.max(alpha, score)
        
        if (beta <= alpha) break // Alpha-beta pruning
      }
      return maxScore
    } else {
      let minScore = Infinity
      for (const move of moves) {
        engine.makeMove(move.from, move.to, move.promotion)
        const score = this.minimax(engine, depth - 1, alpha, beta, true)
        engine.undoMove()
        
        minScore = Math.min(minScore, score)
        beta = Math.min(beta, score)
        
        if (beta <= alpha) break // Alpha-beta pruning
      }
      return minScore
    }
  }

  evaluate(engine) {
    if (engine.isCheckmate()) {
      return engine.getTurn() === 'white' ? -10000 : 10000
    }
    
    if (engine.isDraw()) {
      return 0
    }

    let score = 0
    const board = engine.getBoard()

    // Material evaluation
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece) {
          const value = PIECE_VALUES[piece.type] || 0
          score += piece.color === 'w' ? value : -value
        }
      }
    }

    // Add positional bonuses for higher levels
    if (this.level >= 2) {
      score += this.getPositionalScore(engine, board)
    }

    // Add mobility bonus for higher levels
    if (this.level >= 3) {
      score += this.getMobilityScore(engine)
    }

    return score
  }

  getPositionalScore(engine, board) {
    let score = 0

    // Center control
    const centerSquares = ['d4', 'd5', 'e4', 'e5']
    for (const square of centerSquares) {
      const piece = engine.getPiece(square)
      if (piece) {
        score += piece.color === 'w' ? 0.1 : -0.1
      }
    }

    // King safety (basic)
    if (this.level >= 3) {
      const whiteKing = engine.getKingSquare('white')
      const blackKing = engine.getKingSquare('black')
      
      // Penalize exposed kings in middle game
      if (engine.getMoveCount() < 20) {
        if (whiteKing && (whiteKing[1] !== '1' || !['e', 'g', 'c'].includes(whiteKing[0]))) {
          score -= 0.5
        }
        if (blackKing && (blackKing[1] !== '8' || !['e', 'g', 'c'].includes(blackKing[0]))) {
          score += 0.5
        }
      }
    }

    return score
  }

  getMobilityScore(engine) {
    const currentTurn = engine.getTurn()
    const moves = engine.getAllValidMoves()
    
    // Simple mobility evaluation
    const mobility = moves.length * 0.01
    
    return currentTurn === 'white' ? mobility : -mobility
  }
}
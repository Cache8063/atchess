# Chess AI Architecture Document

## Overview
The AI system implements multiple skill levels using different algorithms and evaluation strategies, from basic random moves to sophisticated neural network-based evaluation.

## Core AI Components

### 1. Base AI Interface
```javascript
class AIPlayer {
  constructor(difficulty, timeLimit) {
    this.difficulty = difficulty;
    this.timeLimit = timeLimit;
    this.evaluator = this.createEvaluator();
  }
  
  async makeMove(board, timeRemaining) {
    // Returns best move in UCI notation
  }
  
  async analyze(board, depth) {
    // Returns evaluation and principal variation
  }
}
```

## Difficulty Levels

### Level 1: Beginner (ELO ~800)
```javascript
class BeginnerAI extends AIPlayer {
  // Characteristics:
  // - 80% random legal moves
  // - 20% basic material counting
  // - Occasional "blunders" (hangs pieces)
  // - No tactical vision
  // - Search depth: 1-2 ply
  
  makeMove(board) {
    const moves = board.getLegalMoves();
    
    // 80% chance of random move
    if (Math.random() < 0.8) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    
    // 20% chance of material-based move
    return this.getBestMaterialMove(moves, board);
  }
  
  getBestMaterialMove(moves, board) {
    // Simple material count:
    // Pawn=1, Knight/Bishop=3, Rook=5, Queen=9
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves) {
      board.makeMove(move);
      const score = this.countMaterial(board);
      board.undoMove();
      
      // Add randomness to make it imperfect
      const noisyScore = score + (Math.random() - 0.5) * 3;
      
      if (noisyScore > bestScore) {
        bestScore = noisyScore;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
}
```

### Level 2: Intermediate (ELO ~1200)
```javascript
class IntermediateAI extends AIPlayer {
  // Characteristics:
  // - Minimax with alpha-beta pruning
  // - Basic positional evaluation
  // - Simple tactics (forks, pins)
  // - Opening book (10 moves)
  // - Search depth: 3-4 ply
  
  constructor() {
    super();
    this.openingBook = new OpeningBook('basic');
    this.transpositionTable = new Map();
  }
  
  makeMove(board) {
    // Check opening book
    if (board.moveCount < 20) {
      const bookMove = this.openingBook.getMove(board.fen);
      if (bookMove) return bookMove;
    }
    
    // Minimax search
    return this.minimax(board, 4, -Infinity, Infinity, true).move;
  }
  
  evaluate(board) {
    let score = 0;
    
    // Material value
    score += this.getMaterialScore(board);
    
    // Basic positional factors
    score += this.getCenterControl(board) * 0.1;
    score += this.getPawnStructure(board) * 0.05;
    score += this.getKingSafety(board) * 0.15;
    
    return score;
  }
  
  minimax(board, depth, alpha, beta, maximizing) {
    // Standard minimax with alpha-beta pruning
    const hash = board.getHash();
    if (this.transpositionTable.has(hash)) {
      return this.transpositionTable.get(hash);
    }
    
    if (depth === 0 || board.isGameOver()) {
      return { score: this.evaluate(board), move: null };
    }
    
    const moves = board.getLegalMoves();
    let bestMove = moves[0];
    let bestScore = maximizing ? -Infinity : Infinity;
    
    for (const move of moves) {
      board.makeMove(move);
      const result = this.minimax(board, depth - 1, alpha, beta, !maximizing);
      board.undoMove();
      
      if (maximizing) {
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (result.score < bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
      }
      
      if (beta <= alpha) break; // Pruning
    }
    
    const result = { score: bestScore, move: bestMove };
    this.transpositionTable.set(hash, result);
    return result;
  }
}
```

### Level 3: Advanced (ELO ~1600)
```javascript
class AdvancedAI extends AIPlayer {
  // Characteristics:
  // - Enhanced evaluation function
  // - Move ordering for better pruning
  // - Null move pruning
  // - Killer heuristic
  // - Extended search for captures
  // - Search depth: 5-6 ply
  
  constructor() {
    super();
    this.openingBook = new OpeningBook('master');
    this.endgameTablebase = new EndgameTablebase();
    this.killerMoves = Array(64).fill(null).map(() => []);
  }
  
  evaluate(board) {
    let score = 0;
    
    // Piece-square tables for positional play
    score += this.getPieceSquareScore(board);
    
    // Advanced pawn structure evaluation
    score += this.evaluatePawns(board);
    
    // Piece mobility
    score += this.evaluateMobility(board);
    
    // King safety with pawn shield
    score += this.evaluateKingSafety(board);
    
    // Endgame specific evaluation
    if (board.isEndgame()) {
      score += this.evaluateEndgame(board);
    }
    
    return score;
  }
  
  search(board, depth, alpha, beta, allowNull = true) {
    // Check endgame tablebase
    if (board.pieceCount <= 6) {
      const tablebaseMove = this.endgameTablebase.probe(board);
      if (tablebaseMove) return tablebaseMove;
    }
    
    // Null move pruning
    if (allowNull && depth > 3 && !board.inCheck()) {
      board.makeNullMove();
      const nullScore = -this.search(board, depth - 3, -beta, -beta + 1, false);
      board.undoMove();
      
      if (nullScore >= beta) {
        return { score: beta, move: null };
      }
    }
    
    // Regular search with enhancements
    const moves = this.orderMoves(board.getLegalMoves(), board, depth);
    
    for (const move of moves) {
      board.makeMove(move);
      
      // Late move reduction
      let newDepth = depth - 1;
      if (depth > 3 && !move.isCapture && !board.inCheck()) {
        newDepth--; // Reduce depth for quiet moves
      }
      
      const result = this.search(board, newDepth, -beta, -alpha, true);
      board.undoMove();
      
      // Update killer moves
      if (result.score >= beta && !move.isCapture) {
        this.killerMoves[depth].unshift(move);
        this.killerMoves[depth] = this.killerMoves[depth].slice(0, 2);
      }
    }
  }
}
```

### Level 4: Expert (ELO ~2000)
```javascript
class ExpertAI extends AIPlayer {
  // Characteristics:
  // - Aspiration windows
  // - Principal variation search
  // - Futility pruning
  // - SEE (Static Exchange Evaluation)
  // - Time management
  // - Search depth: 7-8 ply (up to 20 in critical positions)
  
  constructor() {
    super();
    this.historyTable = new Map();
    this.pvTable = new Map();
    this.timeManager = new TimeManager();
  }
  
  makeMove(board, timeRemaining) {
    const timeAllocation = this.timeManager.allocate(
      timeRemaining, 
      board.moveCount,
      board.complexity()
    );
    
    // Iterative deepening with aspiration windows
    let bestMove = null;
    let alpha = -Infinity;
    let beta = Infinity;
    
    for (let depth = 1; depth <= 20; depth++) {
      const startTime = Date.now();
      
      try {
        const result = this.pvSearch(board, depth, alpha, beta);
        bestMove = result.move;
        
        // Aspiration window for next iteration
        alpha = result.score - 50;
        beta = result.score + 50;
      } catch (timeoutError) {
        break; // Time's up
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed > timeAllocation / 3) {
        break; // Don't start next iteration
      }
    }
    
    return bestMove;
  }
  
  pvSearch(board, depth, alpha, beta) {
    // Principal variation search
    const moves = this.orderMovesPV(board.getLegalMoves(), board);
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    // Search first move with full window
    board.makeMove(moves[0]);
    bestScore = -this.pvSearch(board, depth - 1, -beta, -alpha);
    board.undoMove();
    
    if (bestScore > alpha) {
      alpha = bestScore;
      bestMove = moves[0];
    }
    
    // Search remaining moves with null window
    for (let i = 1; i < moves.length && bestScore < beta; i++) {
      board.makeMove(moves[i]);
      
      // Null window search
      let score = -this.pvSearch(board, depth - 1, -alpha - 1, -alpha);
      
      // Re-search with full window if needed
      if (score > alpha && score < beta) {
        score = -this.pvSearch(board, depth - 1, -beta, -alpha);
      }
      
      board.undoMove();
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = moves[i];
        if (score > alpha) {
          alpha = score;
        }
      }
    }
    
    // Store in PV table
    this.pvTable.set(board.getHash(), bestMove);
    
    return { score: bestScore, move: bestMove };
  }
}
```

### Level 5: Master (ELO ~2400)
```javascript
class MasterAI extends AIPlayer {
  // Characteristics:
  // - Neural network evaluation
  // - Monte Carlo Tree Search (MCTS) hybrid
  // - Advanced time management
  // - Learning from games
  // - Strategic planning
  
  constructor() {
    super();
    this.neuralNet = new ChessNeuralNetwork();
    this.mctsTree = new MCTSTree();
    this.strategicPlans = new StrategicPlanner();
  }
  
  async makeMove(board, timeRemaining) {
    // Combine neural network evaluation with tree search
    const candidates = await this.getCandidateMoves(board);
    
    // MCTS for deep strategic understanding
    const timeAllocation = this.getAllocatedTime(board, timeRemaining);
    const bestMove = await this.mcts(board, candidates, timeAllocation);
    
    // Update strategic plans
    this.strategicPlans.update(board, bestMove);
    
    return bestMove;
  }
  
  async getCandidateMoves(board) {
    // Neural network provides move probabilities
    const moveProbs = await this.neuralNet.getMoveDistribution(board);
    
    // Select top candidates
    return moveProbs
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10)
      .map(m => m.move);
  }
  
  async mcts(board, candidates, timeLimit) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeLimit) {
      // Selection
      let node = this.mctsTree.root;
      const path = [node];
      
      while (node.isExpanded() && !board.isGameOver()) {
        node = node.selectChild();
        path.push(node);
        board.makeMove(node.move);
      }
      
      // Expansion
      if (!board.isGameOver()) {
        const moves = candidates || board.getLegalMoves();
        for (const move of moves) {
          node.addChild(move);
        }
        node = node.selectChild();
        path.push(node);
        board.makeMove(node.move);
      }
      
      // Simulation (using neural network)
      const value = await this.neuralNet.evaluate(board);
      
      // Backpropagation
      for (const n of path) {
        n.update(value);
      }
      
      // Undo all moves
      for (let i = path.length - 1; i > 0; i--) {
        board.undoMove();
      }
    }
    
    // Select best move
    return this.mctsTree.root.getBestMove();
  }
}
```

## Supporting Classes

### Opening Book
```javascript
class OpeningBook {
  constructor(level) {
    this.book = this.loadBook(level);
  }
  
  loadBook(level) {
    // Loads appropriate opening database
    // Basic: 500 positions
    // Master: 50,000+ positions
  }
  
  getMove(fen) {
    const moves = this.book[fen];
    if (!moves) return null;
    
    // Weighted random selection
    const totalWeight = moves.reduce((sum, m) => sum + m.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const move of moves) {
      random -= move.weight;
      if (random <= 0) return move.uci;
    }
  }
}
```

### Evaluation Components
```javascript
class PieceSquareTables {
  // Position-specific piece values
  static PAWN = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
  ];
  // ... similar tables for other pieces
}

class MobilityEvaluator {
  static evaluate(board) {
    let mobility = 0;
    
    for (const square of board.occupiedSquares) {
      const piece = board.getPiece(square);
      const moves = board.getLegalMovesFrom(square);
      
      // Weight by piece type
      const weight = {
        'N': 0.1, 'B': 0.1, 'R': 0.05, 'Q': 0.02
      }[piece.type] || 0;
      
      mobility += moves.length * weight * (piece.color === 'w' ? 1 : -1);
    }
    
    return mobility;
  }
}
```

## Performance Optimizations

### 1. Parallel Search
- Use Web Workers for parallel position analysis
- Split search tree at depth 2-3
- Combine results from worker threads

### 2. Memory Management
- Limited transposition table size (100MB)
- LRU eviction policy
- Periodic garbage collection

### 3. Time Management
```javascript
class TimeManager {
  allocate(totalTime, moveNumber, complexity) {
    // Base allocation
    let time = totalTime / 40; // Assume 40 moves per game
    
    // Adjust for game phase
    if (moveNumber < 10) {
      time *= 0.8; // Faster in opening
    } else if (moveNumber > 30) {
      time *= 1.2; // More time in endgame
    }
    
    // Adjust for position complexity
    time *= complexity; // 0.5 to 2.0 multiplier
    
    // Never use more than 10% of remaining time
    return Math.min(time, totalTime * 0.1);
  }
}
```

## Testing & Tuning

### Self-Play Testing
- Each level plays 1000 games against itself
- Verify ELO ratings through tournaments
- Adjust parameters to match target strength

### Parameter Tuning
```javascript
const tuningParams = {
  beginner: {
    randomness: 0.8,
    blunderRate: 0.15,
    evalNoise: 3.0
  },
  intermediate: {
    searchDepth: 4,
    evalWeights: {
      material: 1.0,
      position: 0.1,
      safety: 0.15
    }
  }
  // ... parameters for each level
};
```

### Performance Benchmarks
- Beginner: 100-200 positions/second
- Intermediate: 1K-5K positions/second
- Advanced: 10K-50K positions/second
- Expert: 100K-500K positions/second
- Master: 1M+ positions/second (with GPU)
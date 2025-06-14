# Chess Game Project Plan

## Overview
A modern, feature-rich chess application with AI opponents, multiplayer capabilities, and atproto integration for social features and persistent stats.

## Core Features

### 1. Chess Engine
- Complete chess rule implementation
- Move validation
- Check/checkmate detection
- En passant, castling, pawn promotion
- Game state management
- Move history and notation (PGN support)

### 2. User Interface
- **Modern Dark Theme Design**
  - Primary background: #1a1a1a
  - Board dark squares: #2c2c2c
  - Board light squares: #4a4a4a
  - Accent color: #3b82f6 (blue)
  - Text: #e5e5e5
- Responsive design (mobile-first)
- Smooth animations for piece movements
- Drag-and-drop + click-to-move support
- Visual move hints and valid move indicators
- Captured pieces display
- Move history sidebar
- Game timer support

### 3. AI Opponents

#### Skill Tiers
1. **Beginner (ELO ~800)**
   - Random legal moves with basic material evaluation
   - Occasional blunders
   - 1-2 ply depth

2. **Intermediate (ELO ~1200)**
   - Minimax with alpha-beta pruning
   - Basic positional evaluation
   - 3-4 ply depth
   - Opening book (first 5-10 moves)

3. **Advanced (ELO ~1600)**
   - Enhanced evaluation function
   - 5-6 ply depth
   - Transposition tables
   - Better endgame knowledge

4. **Expert (ELO ~2000)**
   - Sophisticated evaluation
   - 7-8 ply depth
   - Advanced pruning techniques
   - Full opening book
   - Endgame tablebase integration

5. **Master (ELO ~2400)**
   - Neural network evaluation
   - Deep search optimization
   - Time management
   - Strategic planning

### 4. atproto Integration

#### Authentication
- OAuth flow with atproto server
- JWT token management
- Session persistence

#### User Features
- Profile creation/management
- ELO rating system
- Match history
- Statistics dashboard
  - Win/loss/draw ratios
  - Opening preferences
  - Average game length
  - Performance trends

#### Social Features
- Challenge system
- Friend list
- Spectator mode
- Game sharing (via atproto posts)
- Tournaments

## Technical Architecture

### Frontend Stack
- **Framework**: Vue.js 3 (for reactive UI)
- **State Management**: Pinia
- **Build Tool**: Vite
- **CSS**: Tailwind CSS + custom components
- **Icons**: Lucide Icons
- **Chess Notation**: chess.js library
- **Board Rendering**: Custom Canvas/SVG hybrid

### Backend Requirements
- **atproto Client**: Official SDK
- **WebSocket**: For real-time multiplayer
- **Storage**: IndexedDB for offline play
- **Service Worker**: PWA support

### Project Structure
```
chess/
├── src/
│   ├── components/
│   │   ├── Board.vue
│   │   ├── Piece.vue
│   │   ├── MoveHistory.vue
│   │   ├── GameControls.vue
│   │   ├── PlayerProfile.vue
│   │   └── ChallengeModal.vue
│   ├── engine/
│   │   ├── ChessEngine.js
│   │   ├── MoveValidator.js
│   │   ├── GameState.js
│   │   └── NotationParser.js
│   ├── ai/
│   │   ├── AIPlayer.js
│   │   ├── Evaluator.js
│   │   ├── OpeningBook.js
│   │   └── MinimaxEngine.js
│   ├── services/
│   │   ├── AtprotoService.js
│   │   ├── GameStorage.js
│   │   ├── StatsTracker.js
│   │   └── MultiplayerService.js
│   ├── stores/
│   │   ├── game.js
│   │   ├── user.js
│   │   └── settings.js
│   └── utils/
│       ├── constants.js
│       └── helpers.js
├── public/
│   └── assets/
│       └── pieces/  (SVG chess pieces)
├── tests/
└── docs/
    ├── API.md
    ├── DEVELOPMENT.md
    └── DEPLOYMENT.md
```

## Database Schema (IndexedDB)

### Games Table
```javascript
{
  id: string,
  whitePlayer: string (did),
  blackPlayer: string (did),
  pgn: string,
  result: string, // "1-0", "0-1", "1/2-1/2", "*"
  timestamp: Date,
  timeControl: string,
  opening: string,
  moves: number
}
```

### Stats Table
```javascript
{
  userId: string (did),
  elo: number,
  wins: number,
  losses: number,
  draws: number,
  totalGames: number,
  streak: number,
  bestWin: string (opponent elo),
  favoriteOpening: string
}
```

## API Design (atproto Integration)

### Lexicons
```typescript
// com.chess.game
{
  createGame: {
    input: {
      opponent: string,
      timeControl: string,
      color: "white" | "black" | "random"
    }
  },
  makeMove: {
    input: {
      gameId: string,
      move: string, // UCI notation
      time: number
    }
  },
  getStats: {
    input: {
      did: string
    },
    output: {
      stats: Stats
    }
  }
}
```

## Development Phases

### Phase 1: Core Chess Engine (Week 1-2)
- Basic board representation
- Piece movement logic
- Rule enforcement
- Simple UI

### Phase 2: Modern UI (Week 3)
- Dark theme implementation
- Animations
- Responsive design
- UX polish

### Phase 3: AI Implementation (Week 4-5)
- Basic minimax
- Evaluation functions
- Difficulty levels
- Performance optimization

### Phase 4: atproto Integration (Week 6-7)
- Authentication
- Profile management
- Stats tracking
- Basic multiplayer

### Phase 5: Advanced Features (Week 8+)
- Tournament system
- Advanced AI
- Social features
- Mobile optimization

## Performance Considerations
- Web Workers for AI calculations
- Virtual scrolling for move history
- Lazy loading for game analysis
- Efficient board state representation (bitboards)
- Request caching for atproto API

## Security Considerations
- Move validation on both client and server
- Rate limiting for API calls
- Secure token storage
- Input sanitization for chat/usernames

## Testing Strategy
- Unit tests for chess engine
- Integration tests for AI
- E2E tests for critical user flows
- Performance benchmarks for AI
- Accessibility testing
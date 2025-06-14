# System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Chess Application                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │   Frontend UI   │  │   Game Engine   │  │  AI Opponents   │       │
│  │                 │  │                 │  │                 │       │
│  │ • Vue.js 3     │  │ • Move Valid.   │  │ • 5 Skill Levels│       │
│  │ • Dark Theme   │  │ • Game State    │  │ • Minimax       │       │
│  │ • Responsive   │  │ • PGN Support   │  │ • Neural Net    │       │
│  │ • Animations   │  │ • Rule Engine   │  │ • Opening Book  │       │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘       │
│           │                    │                    │                  │
│           └────────────────────┴────────────────────┘                  │
│                               │                                        │
│                    ┌──────────┴──────────┐                           │
│                    │   State Management  │                           │
│                    │      (Pinia)        │                           │
│                    └──────────┬──────────┘                           │
│                               │                                        │
├───────────────────────────────┼─────────────────────────────────────┤
│                               │                                        │
│                    ┌──────────┴──────────┐                           │
│                    │  Service Layer      │                           │
│                    ├──────────────────────┤                           │
│                    │ • AtprotoService    │                           │
│                    │ • GameStorage       │                           │
│                    │ • StatsTracker      │                           │
│                    │ • MultiplayerService│                           │
│                    └──────────┬──────────┘                           │
│                               │                                        │
├───────────────────────────────┼─────────────────────────────────────┤
│                               │                                        │
│         ┌─────────────────────┴─────────────────────┐                │
│         │                                           │                │
│   ┌─────┴──────┐                    ┌──────────────┴──────┐         │
│   │ Local      │                    │ AT Protocol         │         │
│   │ Storage    │                    │ Integration         │         │
│   │            │                    │                     │         │
│   │ • IndexedDB│                    │ • Authentication    │         │
│   │ • Game DB │                    │ • Game Records      │         │
│   │ • Settings│                    │ • User Profiles     │         │
│   │ • Cache   │                    │ • Challenges        │         │
│   └────────────┘                    │ • Social Features   │         │
│                                     └─────────┬───────────┘         │
│                                               │                      │
└───────────────────────────────────────────────┼──────────────────────┘
                                                │
                                    ┌───────────┴────────────┐
                                    │   AT Protocol Server   │
                                    │                        │
                                    │ • User Repositories   │
                                    │ • Lexicon Validation  │
                                    │ • WebSocket Updates   │
                                    │ • Federation          │
                                    └────────────────────────┘

Data Flow:
─────────
1. User Action → UI Component → Pinia Store → Service Layer
2. Service Layer → Local Storage (cache) OR AT Protocol (persistent)
3. Game Engine ← → AI Engine (for computer opponents)
4. Real-time Updates: AT Protocol WebSocket → Service Layer → UI

Key Integrations:
────────────────
• OAuth 2.0 for AT Protocol authentication
• WebSocket for real-time game updates
• Service Workers for offline play
• Web Workers for AI calculations
```

## Component Responsibilities

### Frontend Layer
- **UI Components**: Handle user interactions and display
- **State Management**: Centralized state with Pinia
- **Routing**: Vue Router for navigation

### Core Logic Layer
- **Game Engine**: Chess rules, move validation, game state
- **AI Engine**: Computer opponents with varying difficulty
- **Analysis**: Position evaluation, move suggestions

### Service Layer
- **AtprotoService**: AT Protocol API integration
- **GameStorage**: Local and remote game persistence
- **StatsTracker**: ELO calculation and statistics
- **MultiplayerService**: Real-time game coordination

### Storage Layer
- **Local**: IndexedDB for offline play and caching
- **Remote**: AT Protocol repositories for permanent storage

## Security Boundaries
```
┌─────────────────────────┐
│   Client (Browser)      │ ← Input validation
├─────────────────────────┤   HTTPS only
│   Service Layer         │ ← Auth tokens
├─────────────────────────┤   Rate limiting
│   AT Protocol Server    │ ← Lexicon validation
└─────────────────────────┘   DID verification
```
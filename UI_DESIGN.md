# Chess Game UI/UX Design Document

## Design System

### Color Palette (Dark Theme)
```css
:root {
  /* Background layers */
  --bg-primary: #0a0a0a;      /* Main background */
  --bg-secondary: #141414;    /* Card/panel background */
  --bg-tertiary: #1f1f1f;     /* Elevated elements */
  
  /* Chess board */
  --board-dark: #2d4a2b;      /* Dark squares (subtle green) */
  --board-light: #e8e6d1;     /* Light squares (warm white) */
  --board-border: #3a3a3a;    /* Board border */
  
  /* Interactive states */
  --highlight-move: #5a9fd4;  /* Last move highlight */
  --highlight-valid: #4ade80; /* Valid move indicators */
  --highlight-check: #ef4444; /* King in check */
  --highlight-hover: #60a5fa; /* Hover state */
  
  /* Text */
  --text-primary: #e5e5e5;    /* Main text */
  --text-secondary: #a3a3a3;  /* Secondary text */
  --text-muted: #737373;      /* Muted text */
  
  /* Accent colors */
  --accent-primary: #3b82f6;  /* Primary blue */
  --accent-success: #10b981;  /* Success green */
  --accent-warning: #f59e0b;  /* Warning orange */
  --accent-error: #ef4444;    /* Error red */
}
```

### Typography
- **Font Family**: 'Inter' for UI, 'JetBrains Mono' for notation
- **Headings**: Bold, 1.5-2.5rem
- **Body**: Regular, 0.875-1rem
- **Notation**: Monospace, 0.875rem

## Layout Structure

### Desktop Layout (1200px+)
```
┌─────────────────────────────────────────────────────────┐
│ Header (User info, Settings, Notifications)             │
├─────────────┬─────────────────────────┬─────────────────┤
│ Player Info │                         │ Game Info       │
│ (Top)       │                         │ - Timer         │
│ - Avatar    │      Chess Board        │ - Move History  │
│ - Name      │      (800x800px)        │ - Notation     │
│ - Rating    │                         │ - Analysis      │
│ - Timer     │                         │                 │
├─────────────┤                         ├─────────────────┤
│ Captured    │                         │ Chat/Notes      │
│ Pieces      │                         │ (Multiplayer)   │
├─────────────┴─────────────────────────┴─────────────────┤
│ Player Info (Bottom) - Same as top                      │
├─────────────────────────────────────────────────────────┤
│ Game Controls (New Game, Resign, Draw, Analysis)        │
└─────────────────────────────────────────────────────────┘
```

### Mobile Layout (<768px)
```
┌─────────────────────┐
│ Compact Header      │
├─────────────────────┤
│ Player (Top)        │
├─────────────────────┤
│                     │
│   Chess Board       │
│   (100% width)      │
│                     │
├─────────────────────┤
│ Player (Bottom)     │
├─────────────────────┤
│ Tabbed Controls     │
│ [Moves|Chat|Menu]   │
└─────────────────────┘
```

## Component Designs

### 1. Chess Board
- **Square Size**: 100px (desktop), responsive (mobile)
- **Piece Style**: Modern flat design with subtle shadows
- **Animations**:
  - Piece movement: 200ms ease-out
  - Capture: Fade out captured piece
  - Check indicator: Pulse animation
- **Interactive Elements**:
  - Hover: Subtle glow on valid destination squares
  - Drag: Ghost piece follows cursor
  - Valid moves: Small dots on valid squares
  - Last move: Highlighted source and destination

### 2. Player Card
```
┌─────────────────────────┐
│ ◉ John_Doe  ELO: 1523  │
│ ⏱ 05:42                │
│ ♔♕♖♖♗♗♘♘♙♙♙           │
└─────────────────────────┘
```

### 3. Move History Panel
```
┌─────────────────────────┐
│ Move History            │
├─────────────────────────┤
│ 1. e4    e5            │
│ 2. Nf3   Nc6           │
│ 3. Bb5   a6            │
│ 4. Ba4   Nf6           │
│ ...                     │
├─────────────────────────┤
│ [Export PGN] [Analyze]  │
└─────────────────────────┘
```

### 4. Game Setup Modal
```
┌─────────────────────────────────┐
│ New Game                    [X] │
├─────────────────────────────────┤
│ Opponent:                       │
│ ┌─────────────────────────────┐ │
│ │ ○ AI Player                 │ │
│ │   Difficulty: [Beginner ▼]  │ │
│ │ ○ Online Player             │ │
│ │ ○ Local Player              │ │
│ └─────────────────────────────┘ │
│                                 │
│ Time Control:                   │
│ [Rapid 10+0] [Blitz 5+0]       │
│ [Bullet 1+0] [Custom]          │
│                                 │
│ Play as: ○ White ● Black ○ Random │
│                                 │
│ [Cancel]          [Start Game]  │
└─────────────────────────────────┘
```

### 5. Profile/Stats View
```
┌─────────────────────────────────┐
│ Profile: @user.bsky.social      │
├─────────────────────────────────┤
│ Rating: 1523 (↑23)              │
│ Rank: Club Player               │
│                                 │
│ Statistics:                     │
│ ├─ Total Games: 245             │
│ ├─ Win Rate: 52.3%              │
│ ├─ W: 128 | D: 37 | L: 80       │
│ └─ Current Streak: W3           │
│                                 │
│ Recent Games:                   │
│ ├─ ✓ vs AI_Expert (1800)        │
│ ├─ ✓ vs john_doe (1456)         │
│ └─ ✗ vs chess_master (1687)     │
│                                 │
│ [View All Stats]                │
└─────────────────────────────────┘
```

## Animations & Micro-interactions

### Piece Movements
- **Drag Start**: Scale piece to 1.1x, add shadow
- **Drag**: Follow cursor with slight lag
- **Drop**: Smooth transition to final position
- **Invalid Drop**: Shake animation, return to origin

### Board Interactions
- **Square Hover**: Subtle brightness increase
- **Valid Move Indicator**: Fade in dots/squares
- **Capture Preview**: Red tint on target piece
- **Check State**: Pulsing red border on king

### UI Transitions
- **Modal Open**: Fade in with scale from 0.95 to 1
- **Tab Switch**: Slide transition
- **Notification**: Slide in from top-right
- **Loading State**: Skeleton screens for content

## Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1440px
- **Large Desktop**: > 1440px

## Accessibility Features
- **Keyboard Navigation**: Full board control via arrow keys
- **Screen Reader Support**: Descriptive labels for all moves
- **High Contrast Mode**: Optional toggle
- **Move Announcements**: Audio cues for moves
- **Color Blind Mode**: Alternative piece indicators

## Loading States
- **Initial Load**: Chess piece animation
- **Move Processing**: Subtle spinner on board
- **AI Thinking**: Progress bar with "Thinking..." text
- **Network Delays**: Ghost pieces for predicted moves

## Error States
- **Connection Lost**: Toast notification with retry
- **Invalid Move**: Shake animation with error sound
- **Game Error**: Modal with options to restore/restart

## Sound Design (Optional)
- **Move**: Soft wood click
- **Capture**: Slightly louder click
- **Check**: Alert tone
- **Game End**: Victory/defeat chime
- **UI interactions**: Subtle clicks

## Progressive Enhancement
1. **Core**: Basic board with click-to-move
2. **Enhanced**: Drag-and-drop, animations
3. **Full**: Real-time multiplayer, advanced analysis
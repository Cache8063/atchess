export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'chess-bg-primary': '#0a0a0a',
        'chess-bg-secondary': '#141414',
        'chess-bg-tertiary': '#1f1f1f',
        'chess-board-dark': '#2d4a2b',
        'chess-board-light': '#e8e6d1',
        'chess-board-border': '#3a3a3a',
        'chess-highlight-move': '#5a9fd4',
        'chess-highlight-valid': '#4ade80',
        'chess-highlight-check': '#ef4444',
        'chess-highlight-hover': '#60a5fa',
        'chess-text-primary': '#e5e5e5',
        'chess-text-secondary': '#a3a3a3',
        'chess-text-muted': '#737373',
        'chess-accent-primary': '#3b82f6',
        'chess-accent-success': '#10b981',
        'chess-accent-warning': '#f59e0b',
        'chess-accent-error': '#ef4444'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace']
      },
      animation: {
        'piece-move': 'pieceMove 0.2s ease-out',
        'check-pulse': 'checkPulse 1s infinite',
        'piece-capture': 'pieceCapture 0.3s ease-out'
      },
      keyframes: {
        pieceMove: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' }
        },
        checkPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
          '50%': { boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' }
        },
        pieceCapture: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.5)' }
        }
      }
    },
  },
  plugins: [],
}
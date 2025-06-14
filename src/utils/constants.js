export const PIECE_UNICODE = {
  'K': '♔',
  'Q': '♕',
  'R': '♖',
  'B': '♗',
  'N': '♘',
  'P': '♙',
  'k': '♚',
  'q': '♛',
  'r': '♜',
  'b': '♝',
  'n': '♞',
  'p': '♟'
}

export const PIECE_VALUES = {
  'p': 1,
  'n': 3,
  'b': 3,
  'r': 5,
  'q': 9,
  'k': 0
}

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export const TIME_CONTROLS = [
  { label: 'Bullet 1+0', time: 60, increment: 0 },
  { label: 'Blitz 3+0', time: 180, increment: 0 },
  { label: 'Blitz 5+0', time: 300, increment: 0 },
  { label: 'Rapid 10+0', time: 600, increment: 0 },
  { label: 'Rapid 15+10', time: 900, increment: 10 },
  { label: 'Classical 30+0', time: 1800, increment: 0 }
]

export const AI_DIFFICULTIES = [
  { level: 1, name: 'Beginner', elo: 800, description: 'Learning the basics' },
  { level: 2, name: 'Intermediate', elo: 1200, description: 'Knows tactics' },
  { level: 3, name: 'Advanced', elo: 1600, description: 'Strong club player' },
  { level: 4, name: 'Expert', elo: 2000, description: 'Tournament strength' },
  { level: 5, name: 'Master', elo: 2400, description: 'Professional level' }
]

export const SQUARES = [
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'
]

export const FILE_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
export const RANK_NUMBERS = ['8', '7', '6', '5', '4', '3', '2', '1']
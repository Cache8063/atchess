export function squareToIndex(square) {
  const file = square.charCodeAt(0) - 97
  const rank = 8 - parseInt(square[1])
  return rank * 8 + file
}

export function indexToSquare(index) {
  const file = String.fromCharCode(97 + (index % 8))
  const rank = 8 - Math.floor(index / 8)
  return file + rank
}

export function isLightSquare(index) {
  const row = Math.floor(index / 8)
  const col = index % 8
  return (row + col) % 2 === 0
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function calculateEloChange(playerElo, opponentElo, result, kFactor = 32) {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
  const actualScore = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0
  return Math.round(kFactor * (actualScore - expectedScore))
}

export function parsePGN(pgn) {
  const lines = pgn.trim().split('\n')
  const headers = {}
  const moves = []
  
  let inHeaders = true
  
  for (const line of lines) {
    if (inHeaders) {
      const match = line.match(/^\[(\w+)\s+"(.*)"\]$/)
      if (match) {
        headers[match[1]] = match[2]
      } else if (line.trim() === '') {
        inHeaders = false
      }
    } else {
      const movesInLine = line.split(/\d+\./).filter(Boolean)
      moves.push(...movesInLine.map(m => m.trim()).filter(Boolean))
    }
  }
  
  return { headers, moves }
}

export function generatePGN(game, headers = {}) {
  const defaultHeaders = {
    Event: 'Online Game',
    Site: 'Chess AT Protocol',
    Date: new Date().toISOString().split('T')[0],
    Round: '1',
    White: headers.White || 'Player 1',
    Black: headers.Black || 'Player 2',
    Result: headers.Result || '*'
  }
  
  const finalHeaders = { ...defaultHeaders, ...headers }
  
  let pgn = ''
  for (const [key, value] of Object.entries(finalHeaders)) {
    pgn += `[${key} "${value}"]\n`
  }
  pgn += '\n'
  
  const history = game.history()
  for (let i = 0; i < history.length; i++) {
    if (i % 2 === 0) {
      pgn += `${Math.floor(i / 2) + 1}. `
    }
    pgn += history[i] + ' '
  }
  
  pgn += finalHeaders.Result
  
  return pgn.trim()
}

export function getSquareColor(square) {
  const file = square.charCodeAt(0) - 97
  const rank = parseInt(square[1]) - 1
  return (file + rank) % 2 === 0 ? 'light' : 'dark'
}

export function generateGameId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
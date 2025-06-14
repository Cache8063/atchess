<template>
  <div class="game-view">
    <div class="game-layout">
      <!-- Left Panel - Player Info (Top) -->
      <div class="player-panel player-top">
        <PlayerCard :player="topPlayer" :time="topPlayerTime" :captured="capturedByBottom" />
      </div>

      <!-- Center - Chess Board -->
      <div class="board-section">
        <ChessBoard 
          :orientation="gameStore.orientation"
          :interactive="isInteractive"
          :show-coordinates="true"
        />
      </div>

      <!-- Right Panel - Game Info -->
      <div class="info-panel">
        <div class="card mb-4">
          <h3 class="text-lg font-semibold mb-2">Game Status</h3>
          <div class="text-sm space-y-1">
            <div v-if="gameStatus.status === 'playing'">
              <span class="font-medium">{{ currentTurnText }}</span>
            </div>
            <div v-else-if="gameStatus.status === 'checkmate'">
              <span class="text-chess-accent-success font-medium">
                Checkmate! {{ gameStatus.winner === 'white' ? 'White' : 'Black' }} wins
              </span>
            </div>
            <div v-else-if="gameStatus.status === 'stalemate'">
              <span class="text-chess-accent-warning font-medium">Stalemate - Draw</span>
            </div>
            <div v-else-if="gameStatus.status === 'draw'">
              <span class="text-chess-accent-warning font-medium">Draw</span>
            </div>
            <div v-if="gameStatus.status === 'check'" class="text-chess-highlight-check">
              Check!
            </div>
          </div>
        </div>

        <MoveHistory :moves="moveHistory" />
        
        <div class="game-controls mt-4 space-y-2">
          <button @click="flipBoard" class="btn-secondary w-full">
            <RotateCcw class="w-4 h-4 inline mr-2" />
            Flip Board
          </button>
          <button v-if="!gameStore.isGameOver" @click="offerDraw" class="btn-secondary w-full">
            <Handshake class="w-4 h-4 inline mr-2" />
            Offer Draw
          </button>
          <button v-if="!gameStore.isGameOver" @click="resign" class="btn-secondary w-full text-chess-accent-error">
            <Flag class="w-4 h-4 inline mr-2" />
            Resign
          </button>
          <button @click="newGame" class="btn-primary w-full">
            <Plus class="w-4 h-4 inline mr-2" />
            New Game
          </button>
        </div>
      </div>

      <!-- Bottom Panel - Player Info (Bottom) -->
      <div class="player-panel player-bottom">
        <PlayerCard :player="bottomPlayer" :time="bottomPlayerTime" :captured="capturedByTop" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import ChessBoard from '@/components/ChessBoard.vue'
import PlayerCard from '@/components/PlayerCard.vue'
import MoveHistory from '@/components/MoveHistory.vue'
import { RotateCcw, Handshake, Flag, Plus } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const userStore = useUserStore()

let aiPlayer = null
let clockInterval = null

const gameType = computed(() => route.params.id || 'local')
const gameStatus = computed(() => gameStore.gameStatus)
const currentTurn = computed(() => gameStore.currentTurn)
const moveHistory = computed(() => gameStore.moveHistory)

const topPlayer = computed(() => {
  return gameStore.orientation === 'white' 
    ? gameStore.gameState.black 
    : gameStore.gameState.white
})

const bottomPlayer = computed(() => {
  return gameStore.orientation === 'white' 
    ? gameStore.gameState.white 
    : gameStore.gameState.black
})

const topPlayerTime = computed(() => {
  return gameStore.orientation === 'white' 
    ? gameStore.blackTime 
    : gameStore.whiteTime
})

const bottomPlayerTime = computed(() => {
  return gameStore.orientation === 'white' 
    ? gameStore.whiteTime 
    : gameStore.blackTime
})

const capturedByTop = computed(() => {
  return gameStore.orientation === 'white'
    ? gameStore.capturedPieces.black
    : gameStore.capturedPieces.white
})

const capturedByBottom = computed(() => {
  return gameStore.orientation === 'white'
    ? gameStore.capturedPieces.white
    : gameStore.capturedPieces.black
})

const currentTurnText = computed(() => {
  return currentTurn.value === 'white' ? "White's turn" : "Black's turn"
})

const isInteractive = computed(() => {
  if (gameStore.isGameOver) return false
  if (gameType.value === 'local') return true
  if (gameType.value === 'ai') {
    return (currentTurn.value === 'white' && bottomPlayer.value !== 'AI') ||
           (currentTurn.value === 'black' && topPlayer.value !== 'AI')
  }
  return gameStore.isMyTurn
})

function flipBoard() {
  gameStore.flipBoard()
}

function offerDraw() {
  if (confirm('Are you sure you want to offer a draw?')) {
    gameStore.offerDraw()
  }
}

function resign() {
  if (confirm('Are you sure you want to resign?')) {
    const color = gameStore.orientation
    gameStore.resign(color)
  }
}

function newGame() {
  router.push('/')
}

function startClock() {
  clockInterval = setInterval(() => {
    if (gameStore.gameState.status === 'playing') {
      // Update time display
    }
  }, 100)
}

function stopClock() {
  if (clockInterval) {
    clearInterval(clockInterval)
    clockInterval = null
  }
}

// Watch for AI moves
watch([currentTurn, gameStatus], async ([turn, status]) => {
  if (status.status !== 'playing') return
  
  if (gameType.value === 'ai') {
    const isAITurn = (turn === 'white' && gameStore.gameState.white === 'AI') ||
                     (turn === 'black' && gameStore.gameState.black === 'AI')
    
    if (isAITurn) {
      // Delay for better UX
      setTimeout(() => {
        makeAIMove()
      }, 500)
    }
  }
})

async function makeAIMove() {
  if (!aiPlayer) {
    const { AIPlayer } = await import('@/ai/AIPlayer')
    aiPlayer = new AIPlayer(gameStore.gameState.aiLevel || 2)
  }
  
  const move = await aiPlayer.getBestMove(gameStore.engine)
  if (move) {
    gameStore.makeMove(move.from, move.to, move.promotion)
  }
}

onMounted(() => {
  if (!gameStore.gameState.id) {
    // No active game, redirect to home
    router.push('/')
    return
  }
  
  startClock()
})

onUnmounted(() => {
  stopClock()
  aiPlayer = null
})
</script>

<style scoped>
.game-view {
  @apply container mx-auto px-4 py-4;
}

.game-layout {
  @apply grid gap-4;
  grid-template-areas: 
    "player-top player-top player-top"
    "board board info"
    "player-bottom player-bottom player-bottom";
  grid-template-columns: 1fr auto 300px;
}

@media (max-width: 1024px) {
  .game-layout {
    grid-template-areas: 
      "player-top"
      "board"
      "player-bottom"
      "info";
    grid-template-columns: 1fr;
  }
  
  .info-panel {
    @apply max-w-md mx-auto;
  }
}

.player-panel {
  @apply max-w-2xl mx-auto w-full;
}

.player-top {
  grid-area: player-top;
}

.board-section {
  grid-area: board;
  @apply flex items-center justify-center;
}

.info-panel {
  grid-area: info;
}

.player-bottom {
  grid-area: player-bottom;
}

.game-controls button {
  @apply flex items-center justify-center;
}
</style>
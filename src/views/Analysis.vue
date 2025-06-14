<template>
  <div class="analysis-container">
    <div class="analysis-header mb-6">
      <h1 class="text-3xl font-bold">Analysis Board</h1>
      <p class="text-chess-text-secondary">Analyze positions and explore variations</p>
    </div>

    <div class="analysis-layout">
      <!-- Board Section -->
      <div class="board-section">
        <ChessBoard 
          :orientation="orientation"
          :interactive="true"
          :show-coordinates="true"
        />
        
        <div class="board-controls mt-4 flex justify-center gap-2">
          <button @click="flipBoard" class="btn-secondary">
            <RotateCcw class="w-4 h-4" />
          </button>
          <button @click="resetBoard" class="btn-secondary">
            <RefreshCw class="w-4 h-4" />
          </button>
          <button @click="clearBoard" class="btn-secondary">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Analysis Panel -->
      <div class="analysis-panel">
        <!-- FEN Input -->
        <div class="card mb-4">
          <h3 class="text-lg font-semibold mb-2">Position (FEN)</h3>
          <div class="flex gap-2">
            <input
              v-model="fenInput"
              type="text"
              class="flex-1 px-3 py-2 bg-chess-bg-tertiary border border-chess-board-border rounded-lg text-sm font-mono"
              placeholder="Enter FEN string"
              @keyup.enter="loadFen"
            />
            <button @click="loadFen" class="btn-primary">
              Load
            </button>
          </div>
          <button @click="copyFen" class="btn-secondary w-full mt-2">
            <Copy class="w-4 h-4 inline mr-2" />
            Copy Current FEN
          </button>
        </div>

        <!-- PGN Input -->
        <div class="card mb-4">
          <h3 class="text-lg font-semibold mb-2">Game (PGN)</h3>
          <textarea
            v-model="pgnInput"
            class="w-full px-3 py-2 bg-chess-bg-tertiary border border-chess-board-border rounded-lg text-sm font-mono resize-none"
            rows="6"
            placeholder="Paste PGN here"
          ></textarea>
          <div class="flex gap-2 mt-2">
            <button @click="loadPgn" class="btn-primary flex-1">
              Load PGN
            </button>
            <button @click="copyPgn" class="btn-secondary flex-1">
              Copy PGN
            </button>
          </div>
        </div>

        <!-- Move History -->
        <MoveHistory :moves="moveHistory" @goToMove="goToMove" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import ChessBoard from '@/components/ChessBoard.vue'
import MoveHistory from '@/components/MoveHistory.vue'
import { RotateCcw, RefreshCw, Trash2, Copy } from 'lucide-vue-next'
import { INITIAL_FEN } from '@/utils/constants'

const gameStore = useGameStore()

const fenInput = ref('')
const pgnInput = ref('')
const orientation = ref('white')

const moveHistory = computed(() => gameStore.moveHistory)
const currentFen = computed(() => gameStore.fen)
const currentPgn = computed(() => gameStore.pgn)

function flipBoard() {
  orientation.value = orientation.value === 'white' ? 'black' : 'white'
}

function resetBoard() {
  gameStore.loadFen(INITIAL_FEN)
  fenInput.value = INITIAL_FEN
  pgnInput.value = ''
}

function clearBoard() {
  const emptyFen = '8/8/8/8/8/8/8/8 w - - 0 1'
  gameStore.loadFen(emptyFen)
  fenInput.value = emptyFen
  pgnInput.value = ''
}

function loadFen() {
  if (fenInput.value) {
    gameStore.loadFen(fenInput.value)
  }
}

function loadPgn() {
  if (pgnInput.value) {
    const success = gameStore.loadPgn(pgnInput.value)
    if (success) {
      fenInput.value = currentFen.value
    } else {
      alert('Invalid PGN format')
    }
  }
}

function copyFen() {
  navigator.clipboard.writeText(currentFen.value)
    .then(() => {
      fenInput.value = currentFen.value
    })
    .catch(() => {
      alert('Failed to copy FEN')
    })
}

function copyPgn() {
  navigator.clipboard.writeText(currentPgn.value)
    .then(() => {
      pgnInput.value = currentPgn.value
    })
    .catch(() => {
      alert('Failed to copy PGN')
    })
}

function goToMove(moveIndex) {
  // This would be implemented to navigate through the game
  console.log('Go to move:', moveIndex)
}

onMounted(() => {
  gameStore.enterAnalysisMode()
  fenInput.value = currentFen.value
})
</script>

<style scoped>
.analysis-layout {
  @apply grid gap-6;
  grid-template-columns: 1fr 400px;
}

@media (max-width: 1024px) {
  .analysis-layout {
    grid-template-columns: 1fr;
  }
  
  .analysis-panel {
    @apply max-w-md mx-auto;
  }
}

.board-section {
  @apply flex flex-col items-center;
}

.board-controls button {
  @apply p-2;
}
</style>
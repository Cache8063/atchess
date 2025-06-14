<template>
  <div class="chess-board-container">
    <div class="chess-board" :class="{ flipped: orientation === 'black' }">
      <div
        v-for="(square, index) in squares"
        :key="square"
        :class="getSquareClasses(square, index)"
        @click="handleSquareClick(square)"
        @dragover.prevent
        @drop="handleDrop($event, square)"
      >
        <div v-if="showCoordinates && shouldShowFile(index)" class="coordinate file">
          {{ getFile(index) }}
        </div>
        <div v-if="showCoordinates && shouldShowRank(index)" class="coordinate rank">
          {{ getRank(index) }}
        </div>
        
        <div
          v-if="getPiece(square)"
          :class="getPieceClasses(square)"
          :draggable="isDraggable(square)"
          @dragstart="handleDragStart($event, square)"
          @dragend="handleDragEnd"
        >
          {{ getPieceSymbol(square) }}
        </div>
        
        <div v-if="isValidMove(square)" class="valid-move-indicator"></div>
        
        <div v-if="isKingInCheck(square)" class="check-indicator"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useSettingsStore } from '@/stores/settings'
import { SQUARES, PIECE_UNICODE } from '@/utils/constants'
import { isLightSquare } from '@/utils/helpers'

const props = defineProps({
  orientation: {
    type: String,
    default: 'white'
  },
  interactive: {
    type: Boolean,
    default: true
  },
  showCoordinates: {
    type: Boolean,
    default: true
  }
})

const gameStore = useGameStore()
const settingsStore = useSettingsStore()

const squares = computed(() => {
  return props.orientation === 'white' ? SQUARES : [...SQUARES].reverse()
})

const board = computed(() => gameStore.board)
const selectedSquare = computed(() => gameStore.selectedSquare)
const validMoves = computed(() => gameStore.validMoves)
const lastMove = computed(() => gameStore.lastMove)
const currentTurn = computed(() => gameStore.currentTurn)
const isCheck = computed(() => gameStore.isCheck)

function getSquareClasses(square, index) {
  return {
    'chess-square': true,
    'chess-square-light': isLightSquare(props.orientation === 'white' ? index : 63 - index),
    'chess-square-dark': !isLightSquare(props.orientation === 'white' ? index : 63 - index),
    'chess-square-selected': square === selectedSquare.value,
    'chess-square-highlighted': isLastMoveSquare(square),
    'chess-square-valid': validMoves.value.includes(square),
    'chess-square-hover': props.interactive
  }
}

function getPiece(square) {
  const file = square.charCodeAt(0) - 97
  const rank = 8 - parseInt(square[1])
  return board.value[rank][file]
}

function getPieceSymbol(square) {
  const piece = getPiece(square)
  if (!piece) return ''
  
  const symbol = piece.color === 'w' 
    ? piece.type.toUpperCase() 
    : piece.type.toLowerCase()
  
  return PIECE_UNICODE[symbol] || ''
}

function getPieceClasses(square) {
  const piece = getPiece(square)
  return {
    'chess-piece': true,
    'chess-piece-white': piece?.color === 'w',
    'chess-piece-black': piece?.color === 'b',
    'chess-piece-dragging': square === selectedSquare.value
  }
}

function isDraggable(square) {
  if (!props.interactive) return false
  const piece = getPiece(square)
  return piece && piece.color === currentTurn.value[0]
}

function isValidMove(square) {
  return validMoves.value.includes(square)
}

function isLastMoveSquare(square) {
  if (!lastMove.value || !settingsStore.highlightLastMove) return false
  return square === lastMove.value.from || square === lastMove.value.to
}

function isKingInCheck(square) {
  if (!isCheck.value) return false
  const piece = getPiece(square)
  return piece && piece.type === 'k' && piece.color === currentTurn.value[0]
}

function handleSquareClick(square) {
  if (!props.interactive) return
  gameStore.selectSquare(square)
}

function handleDragStart(event, square) {
  if (!props.interactive) return
  
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', square)
  
  gameStore.selectSquare(square)
}

function handleDragEnd() {
  // Drag ended
}

function handleDrop(event, square) {
  if (!props.interactive) return
  
  event.preventDefault()
  const from = event.dataTransfer.getData('text/plain')
  
  if (from && validMoves.value.includes(square)) {
    gameStore.makeMove(from, square)
  } else {
    gameStore.clearSelection()
  }
}

function shouldShowFile(index) {
  if (props.orientation === 'white') {
    return index >= 56
  } else {
    return index <= 7
  }
}

function shouldShowRank(index) {
  if (props.orientation === 'white') {
    return index % 8 === 0
  } else {
    return index % 8 === 7
  }
}

function getFile(index) {
  const file = index % 8
  return String.fromCharCode(97 + (props.orientation === 'white' ? file : 7 - file))
}

function getRank(index) {
  const rank = Math.floor(index / 8)
  return props.orientation === 'white' ? 8 - rank : rank + 1
}
</script>

<style scoped>
.chess-board-container {
  @apply flex items-center justify-center;
}

.chess-board {
  @apply grid grid-cols-8 gap-0 border-2 border-chess-board-border rounded-lg overflow-hidden;
  width: min(90vw, 640px);
  height: min(90vw, 640px);
}

.chess-board.flipped {
  transform: rotate(180deg);
}

.chess-board.flipped .chess-piece,
.chess-board.flipped .coordinate {
  transform: rotate(180deg);
}

.chess-square {
  @apply relative aspect-square flex items-center justify-center;
}

.chess-piece {
  @apply text-5xl sm:text-6xl select-none cursor-pointer;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.chess-piece-white {
  @apply text-white;
}

.chess-piece-black {
  @apply text-black;
}

.chess-piece[draggable="true"]:hover {
  @apply scale-110;
}

.chess-piece-dragging {
  @apply opacity-50;
}

.valid-move-indicator {
  @apply absolute w-3 h-3 bg-chess-highlight-valid rounded-full opacity-70;
}

.check-indicator {
  @apply absolute inset-0 border-4 border-chess-highlight-check animate-check-pulse;
}

.coordinate {
  @apply absolute text-xs font-medium opacity-70;
}

.coordinate.file {
  @apply bottom-1 right-1;
}

.coordinate.rank {
  @apply top-1 left-1;
}

.chess-square-light .coordinate {
  @apply text-chess-board-dark;
}

.chess-square-dark .coordinate {
  @apply text-chess-board-light;
}

.chess-square-selected {
  @apply ring-4 ring-chess-accent-primary ring-opacity-70;
}

.chess-square-highlighted {
  @apply bg-chess-highlight-move bg-opacity-40;
}

@media (max-width: 640px) {
  .chess-piece {
    @apply text-4xl;
  }
}
</style>
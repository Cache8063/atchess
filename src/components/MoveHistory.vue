<template>
  <div class="move-history card">
    <h3 class="text-lg font-semibold mb-3">Moves</h3>
    <div class="moves-container">
      <div v-if="moves.length === 0" class="text-chess-text-secondary text-sm">
        No moves yet
      </div>
      <div v-else class="moves-list">
        <div v-for="(movePair, index) in movePairs" :key="index" class="move-pair">
          <span class="move-number">{{ index + 1 }}.</span>
          <span class="move white-move" @click="goToMove(index * 2)">
            {{ movePair.white }}
          </span>
          <span v-if="movePair.black" class="move black-move" @click="goToMove(index * 2 + 1)">
            {{ movePair.black }}
          </span>
        </div>
      </div>
    </div>
    
    <div v-if="moves.length > 0" class="controls mt-3 flex justify-between">
      <button @click="goToStart" class="control-btn" :disabled="currentMoveIndex === -1">
        <SkipBack class="w-4 h-4" />
      </button>
      <button @click="goToPrevious" class="control-btn" :disabled="currentMoveIndex === -1">
        <ChevronLeft class="w-4 h-4" />
      </button>
      <button @click="goToNext" class="control-btn" :disabled="currentMoveIndex === moves.length - 1">
        <ChevronRight class="w-4 h-4" />
      </button>
      <button @click="goToEnd" class="control-btn" :disabled="currentMoveIndex === moves.length - 1">
        <SkipForward class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { SkipBack, ChevronLeft, ChevronRight, SkipForward } from 'lucide-vue-next'

const props = defineProps({
  moves: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['goToMove'])

const currentMoveIndex = ref(-1)

const movePairs = computed(() => {
  const pairs = []
  for (let i = 0; i < props.moves.length; i += 2) {
    pairs.push({
      white: props.moves[i]?.san || '',
      black: props.moves[i + 1]?.san || ''
    })
  }
  return pairs
})

function goToMove(index) {
  currentMoveIndex.value = index
  emit('goToMove', index)
}

function goToStart() {
  currentMoveIndex.value = -1
  emit('goToMove', -1)
}

function goToPrevious() {
  if (currentMoveIndex.value > -1) {
    currentMoveIndex.value--
    emit('goToMove', currentMoveIndex.value)
  }
}

function goToNext() {
  if (currentMoveIndex.value < props.moves.length - 1) {
    currentMoveIndex.value++
    emit('goToMove', currentMoveIndex.value)
  }
}

function goToEnd() {
  currentMoveIndex.value = props.moves.length - 1
  emit('goToMove', currentMoveIndex.value)
}
</script>

<style scoped>
.moves-container {
  @apply max-h-64 overflow-y-auto;
}

.moves-list {
  @apply space-y-1;
}

.move-pair {
  @apply flex items-center gap-2 text-sm;
}

.move-number {
  @apply text-chess-text-muted font-medium min-w-[2rem];
}

.move {
  @apply cursor-pointer hover:text-chess-accent-primary transition-colors font-mono flex-1;
}

.white-move {
  @apply min-w-[4rem];
}

.black-move {
  @apply min-w-[4rem];
}

.control-btn {
  @apply p-1.5 rounded hover:bg-chess-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.moves-container::-webkit-scrollbar {
  @apply w-2;
}

.moves-container::-webkit-scrollbar-track {
  @apply bg-chess-bg-tertiary rounded;
}

.moves-container::-webkit-scrollbar-thumb {
  @apply bg-chess-board-border rounded hover:bg-chess-text-muted;
}
</style>
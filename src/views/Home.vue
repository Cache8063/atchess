<template>
  <div class="home-container">
    <div class="hero-section">
      <h1 class="text-4xl md:text-6xl font-bold text-center mb-4">
        Chess Reimagined
      </h1>
      <p class="text-xl text-chess-text-secondary text-center mb-8">
        Play chess with AI opponents or challenge friends on AT Protocol
      </p>
    </div>

    <div class="game-modes grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      <div class="card hover:border-chess-accent-primary transition-colors cursor-pointer" @click="showAIModal = true">
        <div class="flex items-center justify-center mb-4">
          <Bot class="w-16 h-16 text-chess-accent-primary" />
        </div>
        <h2 class="text-2xl font-semibold mb-2">Play vs AI</h2>
        <p class="text-chess-text-secondary mb-4">
          Challenge our AI opponents with 5 difficulty levels
        </p>
        <div class="flex flex-wrap gap-2">
          <span v-for="level in aiLevels" :key="level.name" 
                class="text-sm px-2 py-1 bg-chess-bg-tertiary rounded">
            {{ level.name }}
          </span>
        </div>
      </div>

      <div class="card hover:border-chess-accent-primary transition-colors cursor-pointer" @click="handleOnlinePlay">
        <div class="flex items-center justify-center mb-4">
          <Users class="w-16 h-16 text-chess-accent-success" />
        </div>
        <h2 class="text-2xl font-semibold mb-2">Play Online</h2>
        <p class="text-chess-text-secondary mb-4">
          Challenge other players on the AT Protocol network
        </p>
        <div class="text-sm text-chess-text-muted">
          Login required
        </div>
      </div>

      <div class="card hover:border-chess-accent-primary transition-colors cursor-pointer" @click="handleLocalPlay">
        <div class="flex items-center justify-center mb-4">
          <Monitor class="w-16 h-16 text-chess-accent-warning" />
        </div>
        <h2 class="text-2xl font-semibold mb-2">Local Play</h2>
        <p class="text-chess-text-secondary mb-4">
          Play with a friend on the same device
        </p>
        <div class="text-sm text-chess-text-muted">
          Pass and play mode
        </div>
      </div>
    </div>

    <div v-if="userStore.isAuthenticated" class="recent-games mt-12 max-w-6xl mx-auto">
      <h2 class="text-2xl font-semibold mb-4">Recent Games</h2>
      <div class="card">
        <p class="text-chess-text-secondary">No recent games yet. Start playing!</p>
      </div>
    </div>

    <!-- AI Game Setup Modal -->
    <Transition name="modal">
      <div v-if="showAIModal" class="modal-overlay" @click.self="showAIModal = false">
        <div class="modal-content">
          <h3 class="text-2xl font-semibold mb-4">New Game vs AI</h3>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Difficulty</label>
            <div class="grid grid-cols-2 gap-2">
              <button v-for="level in aiLevels" :key="level.level"
                      @click="selectedDifficulty = level.level"
                      :class="getDifficultyButtonClass(level.level)">
                <span class="font-medium">{{ level.name }}</span>
                <span class="text-xs">ELO ~{{ level.elo }}</span>
              </button>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Time Control</label>
            <div class="grid grid-cols-2 gap-2">
              <button v-for="control in timeControls" :key="control.label"
                      @click="selectedTimeControl = control"
                      :class="getTimeControlButtonClass(control)">
                {{ control.label }}
              </button>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Play as</label>
            <div class="grid grid-cols-3 gap-2">
              <button @click="selectedColor = 'white'"
                      :class="getColorButtonClass('white')">
                White
              </button>
              <button @click="selectedColor = 'black'"
                      :class="getColorButtonClass('black')">
                Black
              </button>
              <button @click="selectedColor = 'random'"
                      :class="getColorButtonClass('random')">
                Random
              </button>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <button @click="showAIModal = false" class="btn-secondary">
              Cancel
            </button>
            <button @click="startAIGame" class="btn-primary">
              Start Game
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import { AI_DIFFICULTIES, TIME_CONTROLS } from '@/utils/constants'
import { Bot, Users, Monitor } from 'lucide-vue-next'

const router = useRouter()
const gameStore = useGameStore()
const userStore = useUserStore()

const showAIModal = ref(false)
const selectedDifficulty = ref(2)
const selectedTimeControl = ref(TIME_CONTROLS[3]) // Rapid 10+0
const selectedColor = ref('random')

const aiLevels = AI_DIFFICULTIES
const timeControls = TIME_CONTROLS

function getDifficultyButtonClass(level) {
  return {
    'p-3 rounded-lg border transition-all': true,
    'border-chess-accent-primary bg-chess-accent-primary bg-opacity-20': selectedDifficulty.value === level,
    'border-chess-board-border hover:border-chess-text-secondary': selectedDifficulty.value !== level
  }
}

function getTimeControlButtonClass(control) {
  return {
    'p-2 rounded-lg border transition-all': true,
    'border-chess-accent-primary bg-chess-accent-primary bg-opacity-20': selectedTimeControl.value === control,
    'border-chess-board-border hover:border-chess-text-secondary': selectedTimeControl.value !== control
  }
}

function getColorButtonClass(color) {
  return {
    'p-2 rounded-lg border transition-all': true,
    'border-chess-accent-primary bg-chess-accent-primary bg-opacity-20': selectedColor.value === color,
    'border-chess-board-border hover:border-chess-text-secondary': selectedColor.value !== color
  }
}

function startAIGame() {
  const color = selectedColor.value === 'random' 
    ? Math.random() < 0.5 ? 'white' : 'black'
    : selectedColor.value

  gameStore.newGame({
    white: color === 'white' ? userStore.did || 'Player' : 'AI',
    black: color === 'black' ? userStore.did || 'Player' : 'AI',
    timeControl: selectedTimeControl.value,
    time: selectedTimeControl.value.time,
    increment: selectedTimeControl.value.increment,
    aiLevel: selectedDifficulty.value,
    orientation: color,
    start: true
  })

  router.push('/game/ai')
}

function handleOnlinePlay() {
  if (!userStore.isAuthenticated) {
    router.push('/auth/login')
  } else {
    router.push('/game/online')
  }
}

function handleLocalPlay() {
  gameStore.newGame({
    white: 'Player 1',
    black: 'Player 2',
    timeControl: selectedTimeControl.value,
    time: selectedTimeControl.value.time,
    increment: selectedTimeControl.value.increment,
    start: true
  })

  router.push('/game/local')
}
</script>

<style scoped>
.hero-section {
  @apply mb-12 text-center;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-content {
  animation: modalSlide 0.3s ease-out;
}

@keyframes modalSlide {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
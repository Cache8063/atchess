<template>
  <div class="profile-container max-w-4xl mx-auto">
    <div class="profile-header card mb-6">
      <div class="flex items-center space-x-6">
        <div class="avatar-large">
          <User v-if="!profile.avatar" class="w-12 h-12" />
          <img v-else :src="profile.avatar" :alt="profile.displayName" class="w-full h-full object-cover rounded-full">
        </div>
        
        <div class="flex-1">
          <h1 class="text-3xl font-bold">{{ profile.displayName }}</h1>
          <p class="text-chess-text-secondary">@{{ profile.handle }}</p>
          <div class="flex items-center gap-4 mt-2">
            <span class="text-2xl font-bold text-chess-accent-primary">{{ profile.elo }}</span>
            <span v-if="profile.title" class="badge">{{ profile.title }}</span>
          </div>
        </div>
        
        <div v-if="isOwnProfile" class="text-right">
          <router-link to="/settings" class="btn-secondary">
            <Settings class="w-4 h-4 inline mr-2" />
            Settings
          </router-link>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Stats Card -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-4">Statistics</h2>
        <div class="space-y-3">
          <div class="stat-row">
            <span class="stat-label">Total Games</span>
            <span class="stat-value">{{ profile.games }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Win Rate</span>
            <span class="stat-value">{{ winRate }}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Record</span>
            <span class="stat-value">{{ record }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Peak Rating</span>
            <span class="stat-value">{{ profile.peak }}</span>
          </div>
        </div>
      </div>

      <!-- Performance Chart -->
      <div class="card md:col-span-2">
        <h2 class="text-xl font-semibold mb-4">Rating History</h2>
        <div class="h-64 flex items-center justify-center text-chess-text-secondary">
          <TrendingUp class="w-8 h-8 mr-2" />
          Rating chart coming soon
        </div>
      </div>
    </div>

    <!-- Recent Games -->
    <div class="card mt-6">
      <h2 class="text-xl font-semibold mb-4">Recent Games</h2>
      <div v-if="recentGames.length === 0" class="text-chess-text-secondary py-8 text-center">
        No games played yet
      </div>
      <div v-else class="space-y-2">
        <div v-for="game in recentGames" :key="game.id" 
             class="game-row p-3 rounded-lg hover:bg-chess-bg-tertiary transition-colors cursor-pointer"
             @click="viewGame(game.id)">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div :class="getResultClass(game.result)">
                {{ getResultText(game.result) }}
              </div>
              <div>
                <span class="font-medium">vs {{ getOpponentName(game) }}</span>
                <span class="text-chess-text-secondary text-sm ml-2">{{ game.opening }}</span>
              </div>
            </div>
            <div class="text-sm text-chess-text-muted">
              {{ formatDate(game.completedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { User, Settings, TrendingUp } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const profile = ref({
  handle: '',
  displayName: '',
  avatar: null,
  elo: 1500,
  games: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  peak: 1500,
  title: ''
})

const recentGames = ref([])

const isOwnProfile = computed(() => {
  return !route.params.handle || route.params.handle === userStore.handle
})

const winRate = computed(() => {
  if (profile.value.games === 0) return 0
  return Math.round((profile.value.wins / profile.value.games) * 100)
})

const record = computed(() => {
  return `${profile.value.wins}-${profile.value.losses}-${profile.value.draws}`
})

function getResultClass(result) {
  const isWhite = result.white === profile.value.did
  const won = (isWhite && result.result === '1-0') || (!isWhite && result.result === '0-1')
  const lost = (isWhite && result.result === '0-1') || (!isWhite && result.result === '1-0')
  
  return {
    'w-12 text-center font-medium rounded': true,
    'bg-chess-accent-success bg-opacity-20 text-chess-accent-success': won,
    'bg-chess-accent-error bg-opacity-20 text-chess-accent-error': lost,
    'bg-chess-accent-warning bg-opacity-20 text-chess-accent-warning': result.result === '1/2-1/2'
  }
}

function getResultText(result) {
  const isWhite = result.white === profile.value.did
  const won = (isWhite && result.result === '1-0') || (!isWhite && result.result === '0-1')
  const lost = (isWhite && result.result === '0-1') || (!isWhite && result.result === '1-0')
  
  if (won) return 'W'
  if (lost) return 'L'
  return 'D'
}

function getOpponentName(game) {
  const isWhite = game.white === profile.value.did
  const opponent = isWhite ? game.black : game.white
  
  if (opponent === 'AI') return 'AI Opponent'
  if (opponent.startsWith('did:')) return opponent.substring(0, 10) + '...'
  return opponent
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  
  return date.toLocaleDateString()
}

function viewGame(gameId) {
  router.push(`/game/${gameId}`)
}

async function loadProfile() {
  const handle = route.params.handle || userStore.handle
  
  if (isOwnProfile.value) {
    // Load from user store
    profile.value = {
      handle: userStore.handle,
      displayName: userStore.displayName,
      avatar: userStore.avatar,
      elo: userStore.elo,
      games: userStore.games,
      wins: userStore.wins,
      losses: userStore.losses,
      draws: userStore.draws,
      peak: userStore.peak,
      title: userStore.title,
      did: userStore.did
    }
  } else {
    // Load from AT Protocol
    // This would be implemented with the atproto service
  }
  
  // Load recent games
  // This would be implemented with the atproto service
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.avatar-large {
  @apply w-24 h-24 bg-chess-bg-tertiary rounded-full flex items-center justify-center text-chess-text-secondary;
}

.badge {
  @apply px-2 py-1 bg-chess-accent-primary bg-opacity-20 text-chess-accent-primary rounded text-sm font-medium;
}

.stat-row {
  @apply flex items-center justify-between;
}

.stat-label {
  @apply text-chess-text-secondary;
}

.stat-value {
  @apply font-semibold;
}

.game-row {
  @apply border border-transparent;
}

.game-row:hover {
  @apply border-chess-board-border;
}
</style>
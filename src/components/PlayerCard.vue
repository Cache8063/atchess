<template>
  <div class="player-card card">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="avatar">
          <User v-if="!avatar" class="w-6 h-6" />
          <img v-else :src="avatar" :alt="displayName" class="w-full h-full object-cover rounded-full">
        </div>
        <div>
          <h3 class="font-semibold">{{ displayName }}</h3>
          <p v-if="rating" class="text-sm text-chess-text-secondary">{{ rating }}</p>
        </div>
      </div>
      
      <div class="timer" :class="{ 'timer-low': isLowTime }">
        <Clock class="w-4 h-4 inline mr-1" />
        {{ formattedTime }}
      </div>
    </div>
    
    <div v-if="captured.length > 0" class="captured-pieces mt-3">
      <div class="flex flex-wrap gap-1">
        <span v-for="(piece, index) in captured" :key="index" class="text-2xl opacity-70">
          {{ getPieceSymbol(piece) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PIECE_UNICODE } from '@/utils/constants'
import { formatTime } from '@/utils/helpers'
import { User, Clock } from 'lucide-vue-next'

const props = defineProps({
  player: {
    type: String,
    required: true
  },
  time: {
    type: Number,
    default: 0
  },
  captured: {
    type: Array,
    default: () => []
  }
})

const displayName = computed(() => {
  if (props.player === 'AI') return 'AI Opponent'
  if (props.player?.startsWith('did:')) {
    // This would be resolved from the user store or atproto service
    return props.player.substring(0, 8) + '...'
  }
  return props.player
})

const avatar = computed(() => {
  // Would be fetched from user profile
  return null
})

const rating = computed(() => {
  if (props.player === 'AI') {
    // Get rating based on AI level
    return 'ELO 1200'
  }
  return null
})

const formattedTime = computed(() => {
  return formatTime(Math.floor(props.time))
})

const isLowTime = computed(() => {
  return props.time < 60 && props.time > 0
})

function getPieceSymbol(piece) {
  return PIECE_UNICODE[piece.toLowerCase()] || ''
}</script>

<style scoped>
.player-card {
  @apply p-4;
}

.avatar {
  @apply w-10 h-10 bg-chess-bg-tertiary rounded-full flex items-center justify-center text-chess-text-secondary;
}

.timer {
  @apply text-lg font-mono font-medium;
}

.timer-low {
  @apply text-chess-accent-error animate-pulse;
}

.captured-pieces {
  @apply border-t border-chess-board-border pt-2;
}
</style>
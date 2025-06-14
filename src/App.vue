<template>
  <div class="min-h-screen bg-chess-bg-primary">
    <header class="bg-chess-bg-secondary border-b border-chess-board-border">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold text-chess-text-primary">Chess</h1>
          <span class="text-chess-text-muted text-sm">AT Protocol Powered</span>
        </div>
        
        <nav class="flex items-center space-x-6">
          <router-link to="/" class="text-chess-text-secondary hover:text-chess-text-primary transition-colors">
            Play
          </router-link>
          <router-link to="/puzzles" class="text-chess-text-secondary hover:text-chess-text-primary transition-colors">
            Puzzles
          </router-link>
          <router-link to="/analysis" class="text-chess-text-secondary hover:text-chess-text-primary transition-colors">
            Analysis
          </router-link>
          <router-link to="/profile" class="text-chess-text-secondary hover:text-chess-text-primary transition-colors">
            Profile
          </router-link>
        </nav>
        
        <div class="flex items-center space-x-4">
          <button 
            v-if="!userStore.isAuthenticated"
            @click="handleLogin"
            class="btn-primary"
          >
            Login with AT Protocol
          </button>
          <div v-else class="flex items-center space-x-3">
            <span class="text-chess-text-secondary">{{ userStore.handle }}</span>
            <span class="text-chess-accent-primary font-medium">{{ userStore.elo }}</span>
            <button @click="handleLogout" class="text-chess-text-muted hover:text-chess-text-primary">
              <LogOut class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <main class="container mx-auto px-4 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'
import { useRouter } from 'vue-router'
import { LogOut } from 'lucide-vue-next'

const userStore = useUserStore()
const settingsStore = useSettingsStore()
const router = useRouter()

onMounted(() => {
  // Load settings from localStorage
  settingsStore.loadFromLocalStorage()
  // Check for existing session
  userStore.checkSession()
})

const handleLogin = () => {
  router.push('/auth/login')
}

const handleLogout = async () => {
  await userStore.logout()
  router.push('/')
}
</script>
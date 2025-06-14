<template>
  <div class="login-container max-w-md mx-auto">
    <div class="card">
      <h1 class="text-2xl font-bold mb-6">Login with AT Protocol</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="identifier" class="block text-sm font-medium mb-2">
            Handle or Email
          </label>
          <input
            id="identifier"
            v-model="identifier"
            type="text"
            placeholder="user.bsky.social or user@custom-pds.com"
            class="w-full px-3 py-2 bg-chess-bg-tertiary border border-chess-board-border rounded-lg focus:outline-none focus:border-chess-accent-primary"
            required
            @blur="checkPDS"
          />
          <div v-if="pdsInfo" class="mt-2 text-sm">
            <span class="text-chess-text-muted">PDS: </span>
            <span :class="pdsInfo.type === 'custom' ? 'text-chess-accent-warning' : 'text-chess-accent-success'">
              {{ pdsInfo.service }}
            </span>
          </div>
        </div>
        
        <div>
          <label for="password" class="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="w-full px-3 py-2 bg-chess-bg-tertiary border border-chess-board-border rounded-lg focus:outline-none focus:border-chess-accent-primary"
            required
          />
        </div>
        
        <div v-if="error" class="text-chess-accent-error text-sm">
          {{ error }}
        </div>
        
        <button
          type="submit"
          :disabled="loading"
          class="btn-primary w-full disabled:opacity-50"
        >
          <Loader2 v-if="loading" class="w-4 h-4 inline mr-2 animate-spin" />
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <p class="text-chess-text-secondary mb-3">Or</p>
        <button @click="handleOAuth" class="btn-secondary w-full">
          Login with AT Protocol OAuth
        </button>
      </div>
      
      <div class="mt-6 space-y-4">
        <div class="text-sm text-chess-text-secondary">
          <p>Don't have an account?</p>
          <a href="https://bsky.app" target="_blank" class="text-chess-accent-primary hover:underline">
            Create one on Bluesky
          </a>
        </div>
        
        <div class="text-xs text-chess-text-muted border-t border-chess-board-border pt-4">
          <p class="font-medium mb-1">Custom PDS Support</p>
          <p>This app supports custom AT Protocol servers. Just enter your full handle (e.g., user@custom-pds.com) and we'll automatically detect your PDS.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { PDSDiscovery } from '@/services/PDSDiscovery'
import { Loader2 } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()
const pdsDiscovery = new PDSDiscovery()

const identifier = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const pdsInfo = ref(null)
const checkingPDS = ref(false)

async function checkPDS() {
  if (!identifier.value) {
    pdsInfo.value = null
    return
  }
  
  checkingPDS.value = true
  try {
    pdsInfo.value = await pdsDiscovery.fromHandle(identifier.value)
  } catch (err) {
    console.error('PDS discovery failed:', err)
    pdsInfo.value = null
  } finally {
    checkingPDS.value = false
  }
}

async function handleLogin() {
  loading.value = true
  error.value = ''
  
  try {
    const result = await userStore.login(identifier.value, password.value)
    
    if (result.success) {
      router.push('/')
    } else {
      error.value = result.error || 'Login failed'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

async function handleOAuth() {
  if (pdsInfo.value?.type === 'custom') {
    error.value = 'OAuth login is only available for Bluesky accounts. Please use password login for custom PDS.'
    return
  }
  
  const result = await userStore.loginWithOAuth(identifier.value)
  if (result?.requiresPassword) {
    error.value = result.error
  }
}
</script>

<style scoped>
.login-container {
  @apply py-12;
}
</style>
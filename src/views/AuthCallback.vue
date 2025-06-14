<template>
  <div class="auth-callback-container">
    <div class="card max-w-md mx-auto text-center">
      <Loader2 class="w-12 h-12 mx-auto mb-4 animate-spin text-chess-accent-primary" />
      <h2 class="text-xl font-semibold mb-2">Authenticating...</h2>
      <p class="text-chess-text-secondary">Please wait while we complete your login</p>
      
      <div v-if="error" class="mt-4 text-chess-accent-error">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const error = ref('')

onMounted(async () => {
  const code = route.query.code
  const state = route.query.state
  
  if (!code || !state) {
    error.value = 'Invalid authentication response'
    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)
    return
  }
  
  try {
    const result = await userStore.handleOAuthCallback(code, state)
    
    if (result.success) {
      router.push('/')
    } else {
      error.value = result.error || 'Authentication failed'
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)
  }
})
</script>

<style scoped>
.auth-callback-container {
  @apply py-12;
}
</style>
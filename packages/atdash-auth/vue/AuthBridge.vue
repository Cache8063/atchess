<template>
  <!-- This component is invisible - it only handles cross-domain auth requests -->
  <div v-if="debug" class="auth-bridge-debug">
    Auth Bridge Active ({{ requestCount }} requests handled)
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAtdashAuth } from './useAtdashAuth'

const props = defineProps({
  debug: {
    type: Boolean,
    default: false
  }
})

const { session } = useAtdashAuth()
const requestCount = ref(0)

let messageHandler = null

onMounted(() => {
  // Set up message handler for cross-domain auth requests
  messageHandler = async (event) => {
    // Only handle auth bridge requests
    if (event.data?.type !== 'atdash:auth:request') {
      return
    }

    if (props.debug) {
      console.log('[AuthBridge] Received request from:', event.origin)
    }

    requestCount.value++

    try {
      // Send current session (or null) back to requesting app
      event.source?.postMessage(
        {
          type: 'atdash:auth:response',
          session: session.value,
          timestamp: Date.now()
        },
        event.origin
      )

      if (props.debug) {
        console.log('[AuthBridge] Sent response:', session.value ? 'session' : 'no session')
      }
    } catch (error) {
      console.error('[AuthBridge] Error handling request:', error)
      
      event.source?.postMessage(
        {
          type: 'atdash:auth:response',
          session: null,
          error: 'Failed to get session',
          timestamp: Date.now()
        },
        event.origin
      )
    }
  }

  window.addEventListener('message', messageHandler)
})

onUnmounted(() => {
  if (messageHandler) {
    window.removeEventListener('message', messageHandler)
  }
})
</script>

<style scoped>
.auth-bridge-debug {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 3px;
  font-size: 12px;
  z-index: 9999;
}
</style>
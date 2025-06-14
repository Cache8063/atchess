// Core exports
export { AtdashAuth } from './AtdashAuth'
export { PDSDiscovery } from './PDSDiscovery'
export { CrossDomainAuth } from './CrossDomainAuth'
export { 
  SessionStorage,
  LocalStorageAdapter,
  SessionStorageAdapter,
  MemoryStorageAdapter,
  type StorageAdapter
} from './SessionStorage'

// Type exports
export type {
  PDSInfo,
  AtdashSession,
  AtdashAuthConfig,
  LoginResult,
  AtdashUser,
  AtdashApp,
  AuthEventType,
  AuthEvent
} from './types'

// Vue integration
export { 
  useAtdashAuth, 
  createAtdashAuth,
  ATDASH_AUTH_KEY,
  type UseAtdashAuthReturn 
} from './vue/useAtdashAuth'
// Note: AuthBridge.vue should be imported directly in Vue apps

// Default export
import { AtdashAuth } from './AtdashAuth'
export default AtdashAuth
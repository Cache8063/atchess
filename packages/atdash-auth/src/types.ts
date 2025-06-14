export interface PDSInfo {
  service: string
  type: 'bsky' | 'custom'
  authEndpoint: string
  apiEndpoint: string
  capabilities?: string[]
  did?: string
}

export interface AtdashSession {
  did: string
  handle: string
  email?: string
  accessJwt: string
  refreshJwt: string
  pds: PDSInfo
  expiresAt?: number
  apps?: string[]
}

export interface AtdashAuthConfig {
  appId: string
  appName: string
  appUrl?: string
  redirectUri?: string
  authServiceUrl?: string
  allowedOrigins?: string[]
  storage?: 'localStorage' | 'sessionStorage' | 'memory'
  debug?: boolean
}

export interface LoginResult {
  success: boolean
  session?: AtdashSession
  error?: string
  requiresPassword?: boolean
}

export interface AtdashUser {
  did: string
  handle: string
  displayName?: string
  avatar?: string
  email?: string
}

export interface AtdashApp {
  id: string
  name: string
  url: string
  icon?: string
  description?: string
}

export type AuthEventType = 
  | 'login'
  | 'logout' 
  | 'session-update'
  | 'session-expired'
  | 'sso-request'
  | 'sso-response'

export interface AuthEvent {
  type: AuthEventType
  session?: AtdashSession
  app?: string
  error?: string
}
import { PDSInfo } from './types'

export class PDSDiscovery {
  private cache: Map<string, PDSInfo>
  private debug: boolean

  constructor(debug = false) {
    this.cache = new Map()
    this.debug = debug
  }

  async fromHandle(handle: string): Promise<PDSInfo> {
    const cleanHandle = this.cleanHandle(handle)
    
    // Check cache first
    if (this.cache.has(cleanHandle)) {
      return this.cache.get(cleanHandle)!
    }

    let pdsInfo: PDSInfo

    // Check if it's a Bluesky handle
    if (this.isBlueskyHandle(cleanHandle)) {
      pdsInfo = this.getBlueskyPDS()
    } else {
      // For custom domains, perform discovery
      pdsInfo = await this.discoverCustomPDS(cleanHandle)
    }

    // Cache the result
    this.cache.set(cleanHandle, pdsInfo)
    return pdsInfo
  }

  private cleanHandle(handle: string): string {
    // Remove @ if present and trim whitespace
    return handle.trim().replace(/^@/, '')
  }

  private isBlueskyHandle(handle: string): boolean {
    // Check if it's a .bsky.social handle or just a username (defaults to bsky)
    return handle.endsWith('.bsky.social') || 
           handle.endsWith('.bsky') ||
           (!handle.includes('.') && !handle.includes('@'))
  }

  private getBlueskyPDS(): PDSInfo {
    return {
      service: 'https://bsky.social',
      type: 'bsky',
      authEndpoint: 'https://bsky.social/xrpc',
      apiEndpoint: 'https://bsky.social/xrpc',
      capabilities: ['com.atproto.*', 'app.bsky.*']
    }
  }

  private async discoverCustomPDS(handle: string): Promise<PDSInfo> {
    const domain = this.extractDomain(handle)

    if (this.debug) {
      console.log(`[PDSDiscovery] Discovering PDS for domain: ${domain}`)
    }

    // Try discovery methods in order
    const discoveryMethods = [
      () => this.tryWellKnownDiscovery(domain),
      () => this.tryDirectPDSDiscovery(domain),
      () => this.tryDomainAsPDS(domain)
    ]

    for (const method of discoveryMethods) {
      try {
        const result = await method()
        if (result) {
          if (this.debug) {
            console.log(`[PDSDiscovery] Found PDS:`, result)
          }
          return result
        }
      } catch (error) {
        if (this.debug) {
          console.error(`[PDSDiscovery] Discovery method failed:`, error)
        }
      }
    }

    // Default to Bluesky if all discovery methods fail
    console.warn(`[PDSDiscovery] Could not discover PDS for ${handle}, defaulting to Bluesky`)
    return this.getBlueskyPDS()
  }

  private extractDomain(handle: string): string {
    if (handle.includes('@')) {
      // email-style handle: user@domain.com
      return handle.split('@')[1]
    } else if (handle.includes('.')) {
      // domain-style handle: user.domain.com
      return handle
    } else {
      // fallback
      return `${handle}.bsky.social`
    }
  }

  private async tryWellKnownDiscovery(domain: string): Promise<PDSInfo | null> {
    try {
      const didResponse = await fetch(`https://${domain}/.well-known/atproto-did`, {
        mode: 'cors',
        credentials: 'omit',
        signal: AbortSignal.timeout(5000)
      })
      
      if (didResponse.ok) {
        const did = (await didResponse.text()).trim()
        return await this.resolveDIDToPDS(did)
      }
    } catch (error) {
      // Well-known discovery failed
    }
    return null
  }

  private async tryDirectPDSDiscovery(domain: string): Promise<PDSInfo | null> {
    try {
      const pdsUrl = `https://${domain}`
      const describeResponse = await fetch(
        `${pdsUrl}/xrpc/com.atproto.server.describeServer`,
        {
          mode: 'cors',
          credentials: 'omit',
          signal: AbortSignal.timeout(5000)
        }
      )
      
      if (describeResponse.ok) {
        const serverInfo = await describeResponse.json()
        return {
          service: pdsUrl,
          type: 'custom',
          authEndpoint: `${pdsUrl}/xrpc`,
          apiEndpoint: `${pdsUrl}/xrpc`,
          capabilities: serverInfo.availableUserDomains || ['com.atproto.*'],
          did: serverInfo.did
        }
      }
    } catch (error) {
      // Direct PDS discovery failed
    }
    return null
  }

  private async tryDomainAsPDS(domain: string): Promise<PDSInfo | null> {
    // If domain has subdomain, try parent domain
    const parts = domain.split('.')
    if (parts.length > 2) {
      const parentDomain = parts.slice(-2).join('.')
      return this.tryDirectPDSDiscovery(parentDomain)
    }
    return null
  }

  private async resolveDIDToPDS(did: string): Promise<PDSInfo> {
    // For did:plc:*, use the PLC directory
    if (did.startsWith('did:plc:')) {
      try {
        const plcResponse = await fetch(`https://plc.directory/${did}`, {
          signal: AbortSignal.timeout(5000)
        })
        
        if (plcResponse.ok) {
          const plcData = await plcResponse.json()
          const pdsEndpoint = plcData.service?.find(
            (s: any) => s.type === 'AtprotoPersonalDataServer'
          )?.serviceEndpoint
          
          if (pdsEndpoint) {
            return {
              service: pdsEndpoint,
              type: pdsEndpoint.includes('bsky.social') ? 'bsky' : 'custom',
              authEndpoint: `${pdsEndpoint}/xrpc`,
              apiEndpoint: `${pdsEndpoint}/xrpc`,
              capabilities: ['com.atproto.*'],
              did
            }
          }
        }
      } catch (error) {
        console.error('[PDSDiscovery] PLC resolution failed:', error)
      }
    }

    // For did:web:*, extract the domain
    if (did.startsWith('did:web:')) {
      const domain = did.replace('did:web:', '').replace(/%3A/g, ':')
      const baseUrl = domain.includes(':') ? `https://${domain}` : `https://${domain}`
      
      return {
        service: baseUrl,
        type: 'custom',
        authEndpoint: `${baseUrl}/xrpc`,
        apiEndpoint: `${baseUrl}/xrpc`,
        capabilities: ['com.atproto.*'],
        did
      }
    }

    throw new Error(`Unable to resolve DID: ${did}`)
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCachedPDS(handle: string): PDSInfo | undefined {
    return this.cache.get(this.cleanHandle(handle))
  }
}
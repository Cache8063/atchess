export class PDSDiscovery {
  constructor() {
    this.cache = new Map()
  }

  async fromHandle(handle) {
    // Check cache first
    if (this.cache.has(handle)) {
      return this.cache.get(handle)
    }

    let pdsInfo

    // Check if it's a Bluesky handle
    if (this.isBlueskyHandle(handle)) {
      pdsInfo = {
        service: 'https://bsky.social',
        type: 'bsky',
        authEndpoint: 'https://bsky.social/xrpc',
        apiEndpoint: 'https://bsky.social/xrpc',
        capabilities: ['com.atproto.*', 'app.bsky.*']
      }
    } else {
      // For custom domains, perform discovery
      pdsInfo = await this.discoverCustomPDS(handle)
    }

    // Cache the result
    this.cache.set(handle, pdsInfo)
    return pdsInfo
  }

  isBlueskyHandle(handle) {
    // Remove @ if present
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle
    
    // Check if it's a .bsky.social handle or just a username (defaults to bsky)
    return cleanHandle.endsWith('.bsky.social') || 
           !cleanHandle.includes('.') ||
           cleanHandle.split('.').length === 2 && cleanHandle.endsWith('.bsky')
  }

  async discoverCustomPDS(handle) {
    // Remove @ if present
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle
    const domain = cleanHandle.includes('.') ? cleanHandle : `${cleanHandle}.bsky.social`

    try {
      // Step 1: Try .well-known/atproto-did
      const didResponse = await fetch(`https://${domain}/.well-known/atproto-did`, {
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (didResponse.ok) {
        const did = (await didResponse.text()).trim()
        return await this.resolveDIDToPDS(did)
      }
    } catch (error) {
      console.log('DID resolution failed, trying direct PDS discovery')
    }

    // Step 2: Try direct PDS endpoint
    try {
      const pdsUrl = `https://${domain}`
      const describeResponse = await fetch(`${pdsUrl}/xrpc/com.atproto.server.describeServer`, {
        mode: 'cors',
        credentials: 'omit'
      })
      
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
      console.log('Direct PDS discovery failed')
    }

    // Step 3: Check if the domain itself is a PDS
    try {
      const baseUrl = `https://${domain.split('@').pop()}`
      const describeResponse = await fetch(`${baseUrl}/xrpc/com.atproto.server.describeServer`, {
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (describeResponse.ok) {
        const serverInfo = await describeResponse.json()
        return {
          service: baseUrl,
          type: 'custom',
          authEndpoint: `${baseUrl}/xrpc`,
          apiEndpoint: `${baseUrl}/xrpc`,
          capabilities: serverInfo.availableUserDomains || ['com.atproto.*']
        }
      }
    } catch (error) {
      console.log('Domain PDS check failed')
    }

    // Default to Bluesky if all discovery methods fail
    console.warn(`Could not discover PDS for ${handle}, defaulting to Bluesky`)
    return {
      service: 'https://bsky.social',
      type: 'bsky',
      authEndpoint: 'https://bsky.social/xrpc',
      apiEndpoint: 'https://bsky.social/xrpc',
      capabilities: ['com.atproto.*', 'app.bsky.*']
    }
  }

  async resolveDIDToPDS(did) {
    // For did:plc:*, use the PLC directory
    if (did.startsWith('did:plc:')) {
      try {
        const plcResponse = await fetch(`https://plc.directory/${did}`)
        if (plcResponse.ok) {
          const plcData = await plcResponse.json()
          const pdsEndpoint = plcData.service?.find(s => s.type === 'AtprotoPersonalDataServer')?.serviceEndpoint
          
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
        console.error('PLC resolution failed:', error)
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

  clearCache() {
    this.cache.clear()
  }
}
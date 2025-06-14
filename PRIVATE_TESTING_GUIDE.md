# Private Testing Guide for @atdash/auth

## Testing Strategies Before Public Release

### 1. Local File Testing (Current Setup)
Currently using local file reference:
```json
"dependencies": {
  "@atdash/auth": "file:packages/atdash-auth"
}
```

**Pros:**
- Instant updates when you change code
- No publishing needed
- Perfect for development

**Cons:**
- Only works on your machine
- Can't share with team

### 2. GitHub Packages (Recommended for Teams)

#### Setup:
1. Create a GitHub Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create token with `write:packages` and `read:packages` scopes

2. Configure npm to use GitHub Packages:
   ```bash
   npm login --scope=@cache8063 --registry=https://npm.pkg.github.com
   # Username: YOUR_GITHUB_USERNAME
   # Password: YOUR_GITHUB_TOKEN
   ```

3. Publish to GitHub Packages:
   ```bash
   cd packages/atdash-auth
   npm publish
   ```

4. Install in other projects:
   ```bash
   # Create .npmrc in project root
   echo "@cache8063:registry=https://npm.pkg.github.com" > .npmrc
   
   # Install
   npm install @cache8063/atdash-auth
   ```

### 3. Git Submodules
Add auth module as a git submodule in other projects:
```bash
git submodule add https://github.com/Cache8063/atchess.git chess-module
git submodule init
git submodule update
```

### 4. Direct GitHub Install
Install directly from GitHub:
```bash
npm install github:Cache8063/atchess#main
```

Or specific subdirectory (requires prepare script):
```json
"dependencies": {
  "@atdash/auth": "github:Cache8063/atchess#main:packages/atdash-auth"
}
```

### 5. Local npm Registry (Verdaccio)
Run your own private npm registry:
```bash
# Install globally
npm install -g verdaccio

# Start server
verdaccio

# Publish to local registry
npm publish --registry http://localhost:4873

# Install from local registry
npm install @atdash/auth --registry http://localhost:4873
```

## Testing Checklist

### Before Public Release:

- [ ] **Unit Tests**: Test core functionality
  ```bash
  cd packages/atdash-auth
  npm test
  ```

- [ ] **Integration Tests**: Test in multiple apps
  - [ ] Chess app
  - [ ] Music app (if exists)
  - [ ] Photos app (if exists)

- [ ] **SSO Testing**: Verify cross-app authentication
  - [ ] Login in app A, verify auto-login in app B
  - [ ] Logout in app A, verify logout in app B
  - [ ] Test with different domains

- [ ] **PDS Testing**: Test with different AT Protocol servers
  - [ ] Bluesky (bsky.social)
  - [ ] Custom PDS instance
  - [ ] Offline/error scenarios

- [ ] **Browser Testing**:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Mobile browsers

- [ ] **Performance Testing**:
  - [ ] Bundle size impact
  - [ ] Load time
  - [ ] Memory usage

- [ ] **Security Audit**:
  - [ ] Token storage security
  - [ ] Cross-origin communication
  - [ ] Input validation

## Version Management During Testing

### Alpha/Beta Versions:
```json
{
  "version": "1.0.0-alpha.1"  // Pre-release version
}
```

Increment during testing:
- 1.0.0-alpha.1 → 1.0.0-alpha.2 (alpha releases)
- 1.0.0-beta.1 → 1.0.0-beta.2 (beta releases)
- 1.0.0-rc.1 → 1.0.0-rc.2 (release candidates)
- 1.0.0 (final release)

### Testing in Production-like Environment:

1. **Deploy test apps to subdomains**:
   - chess-test.atdash.app
   - music-test.atdash.app
   
2. **Use feature flags**:
   ```javascript
   const auth = new AtdashAuth({
     appId: 'chess',
     appName: 'AT Chess',
     debug: process.env.NODE_ENV !== 'production',
     // Feature flag for experimental features
     experimental: {
       crossDomainSSO: true
     }
   })
   ```

## When You're Ready to Go Public

1. **Update package name** (if needed):
   ```json
   "name": "@atdash/auth"  // or keep @cache8063/atdash-auth
   ```

2. **Remove private config**:
   - Remove `.npmrc`
   - Remove `publishConfig` from package.json

3. **Publish to npm**:
   ```bash
   npm publish --access public
   ```

4. **Create GitHub Release**:
   - Tag the version: `git tag v1.0.0`
   - Create release notes
   - Announce to community

## Current Status

✅ Local testing setup complete
✅ Ready for GitHub Packages (if desired)
⏳ Awaiting real-world testing
⏳ Public release pending

The module is production-ready but wisely keeping it private for testing!
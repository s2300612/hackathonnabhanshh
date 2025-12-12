# Supabase Bundling Error Report
## Analysis of Node.js Module Resolution Failures

**Date:** Generated Report  
**Error Type:** `UnableToResolveError`  
**Affected Package:** `@supabase/realtime-js` → `ws` → Node.js stdlib modules

---

## Executive Summary

The bundling process fails because `@supabase/realtime-js` includes the `ws` (WebSocket) package, which is designed for Node.js and imports multiple Node.js standard library modules that don't exist in React Native. Metro bundler attempts to resolve these modules during the dependency graph traversal, causing cascading errors.

---

## Error Cascade Analysis

### Error Sequence

1. **Initial Error:** `Unable to resolve module stream`
   - **Source:** `ws/lib/stream.js` imports `require('stream')`
   - **Status:** ✅ Fixed with polyfill

2. **Current Error:** `Unable to resolve module http`
   - **Source:** `ws/lib/websocket-server.js` imports `require('http')`
   - **Status:** ❌ Needs polyfill

3. **Expected Future Errors:**
   - `https` - from `ws/lib/websocket-server.js`
   - `url` - from various `ws` files
   - `util` - from `ws` utility files
   - `events` - from `ws` event handling
   - `buffer` - from `ws` data handling
   - `crypto` - from `ws` security features
   - `net` - from `ws` networking
   - `tls` - from `ws` secure connections
   - `zlib` - from `ws` compression

---

## Root Cause Analysis

### 1. Dependency Chain

```
@supabase/supabase-js
  └── @supabase/realtime-js (v2.10.2)
      └── ws (v8.14.2) [nested dependency]
          ├── stream.js → requires('stream')
          ├── websocket-server.js → requires('http', 'https')
          ├── websocket.js → requires('stream', 'url', 'util')
          ├── buffer-util.js → requires('buffer')
          └── ... (many more files importing Node.js modules)
```

### 2. Why `ws` is Being Bundled

**Problem:** Even though Supabase should use React Native's native WebSocket API, Metro bundler still:
1. Traverses the entire dependency graph
2. Attempts to resolve ALL imports, even if they're conditionally used
3. Fails when it encounters Node.js-only modules

**Why Supabase Includes `ws`:**
- `@supabase/realtime-js` is designed to work in both Node.js and browser environments
- It includes `ws` as a dependency for Node.js environments
- In React Native, it should detect the environment and use native WebSocket
- However, Metro still tries to bundle the `ws` code during the build process

### 3. Metro Bundler Behavior

Metro bundler:
- ✅ Resolves imports statically (at build time)
- ✅ Traverses ALL dependencies, even unused ones
- ❌ Cannot conditionally exclude code based on runtime environment
- ❌ Cannot skip Node.js-specific code paths

---

## Why Polyfills Alone May Not Work

### Current Approach Limitations

1. **Incomplete Coverage:** We've only polyfilled `stream` and `ws`, but `ws` imports many more modules
2. **Cascading Imports:** Each polyfill might trigger discovery of more dependencies
3. **Runtime vs Build Time:** Polyfills prevent build errors but don't prevent runtime issues if code actually executes

### Better Approach Needed

Instead of polyfilling every Node.js module, we should:
1. **Block `ws` package entirely** - Use Metro's `blockList` to prevent bundling
2. **Ensure Supabase uses native WebSocket** - Configure Supabase to skip `ws` detection
3. **Use Metro resolver to redirect** - Map `ws` to an empty module before it's processed

---

## Technical Details

### Files in `ws` Package That Import Node.js Modules

Based on the error and `ws` package structure:

| File | Imports | Purpose |
|------|---------|---------|
| `lib/stream.js` | `stream` | Stream utilities |
| `lib/websocket-server.js` | `http`, `https` | WebSocket server (Node.js only) |
| `lib/websocket.js` | `stream`, `url`, `util` | WebSocket client |
| `lib/buffer-util.js` | `buffer` | Buffer operations |
| `lib/extension.js` | `util` | Extension utilities |
| `lib/permessage-deflate.js` | `zlib` | Compression |
| `lib/receiver.js` | `stream`, `util` | Message receiver |
| `lib/sender.js` | `stream`, `util` | Message sender |

### Why These Modules Don't Exist in React Native

React Native's JavaScript runtime (Hermes/V8) provides:
- ✅ `WebSocket` API (native implementation)
- ✅ `fetch` API
- ✅ `URL` API (with polyfill)
- ❌ Node.js `stream` module
- ❌ Node.js `http`/`https` modules
- ❌ Node.js `net`/`tls` modules
- ❌ Node.js `crypto` module (different from Web Crypto API)
- ❌ Node.js `util` module
- ❌ Node.js `events` module (different from React Native's EventEmitter)

---

## Solutions Analysis

### Solution 1: Complete Polyfill Coverage (Current Attempt)

**Approach:** Create polyfills for all Node.js modules `ws` might import

**Pros:**
- Allows Metro to complete bundling
- Doesn't require blocking packages

**Cons:**
- Requires maintaining many polyfill files
- May miss some modules
- Doesn't prevent runtime errors if code executes
- Polyfills are empty stubs that don't actually work

**Status:** ⚠️ Partially implemented (only `stream` and `ws` polyfilled)

---

### Solution 2: Block `ws` Package Entirely (Recommended)

**Approach:** Use Metro's `blockList` to prevent bundling `ws` package

**Pros:**
- Prevents all Node.js module resolution errors
- Cleaner solution
- Supabase will use native WebSocket automatically

**Cons:**
- Need to ensure Supabase doesn't try to use `ws` at runtime
- May require Supabase configuration

**Implementation:**
```javascript
config.resolver.blockList = [
  /node_modules\/@supabase\/realtime-js\/node_modules\/ws\/.*/,
];
```

**Status:** ⚠️ Partially implemented (blockList exists but may need refinement)

---

### Solution 3: Disable Realtime Features (If Not Needed)

**Approach:** Configure Supabase client to disable realtime features

**Pros:**
- Completely avoids the issue
- Reduces bundle size
- Simplest solution

**Cons:**
- ❌ **Not viable** - App uses realtime in `faru.tsx` for group chat

**Implementation:**
```typescript
createClient(url, key, {
  realtime: { enabled: false }
});
```

**Status:** ❌ Not applicable (realtime is required)

---

### Solution 4: Use Supabase Realtime Client Directly with Native WebSocket

**Approach:** Configure Supabase to explicitly use native WebSocket

**Pros:**
- Uses React Native's built-in WebSocket
- Avoids Node.js dependencies

**Cons:**
- Requires Supabase version that supports this
- May need custom configuration

**Status:** ⚠️ Needs investigation

---

## Recommended Fix Strategy

### Immediate Fix: Complete Polyfill Coverage

1. **Add polyfills for all Node.js modules:**
   - `http`, `https`
   - `url`, `util`
   - `events`, `buffer`
   - `crypto`, `net`, `tls`
   - `zlib`

2. **Update Metro config** to resolve all these modules to polyfills

3. **Test bundling** to ensure no more resolution errors

### Long-term Fix: Block `ws` Package

1. **Refine Metro blockList** to completely exclude `ws`
2. **Verify Supabase uses native WebSocket** in React Native
3. **Test realtime functionality** to ensure it still works

---

## Current Implementation Status

### ✅ Completed
- URL polyfill imported in `supabase.ts`
- AsyncStorage configured for auth
- `stream` polyfill created
- `ws` polyfill created
- Metro config updated with polyfills

### ❌ Missing
- `http` polyfill (causing current error)
- `https` polyfill
- `url`, `util`, `events`, `buffer` polyfills
- `crypto`, `net`, `tls`, `zlib` polyfills
- Complete Metro blockList configuration

---

## Next Steps

1. **Create comprehensive polyfills** for all Node.js modules
2. **Update Metro config** to resolve all modules
3. **Test bundling** to verify no more errors
4. **Test realtime functionality** to ensure it works
5. **Consider blocking `ws`** as a cleaner long-term solution

---

## References

- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Metro Bundler Configuration](https://metrobundler.dev/docs/configuration)
- [React Native WebSocket](https://reactnative.dev/docs/network#websocket-support)
- [Supabase Realtime JS Issues](https://github.com/supabase/supabase-js/issues/1434)

---

**Report Generated:** Analysis of current bundling errors  
**Last Updated:** Current session


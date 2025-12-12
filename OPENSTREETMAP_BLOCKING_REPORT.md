# OpenStreetMap Blocking Report
## Analysis of Potential Issues Preventing Map Tiles from Loading

**Date:** Generated Report  
**Component:** `src/components/pulse-map.tsx`  
**Map Library:** `react-native-maps@1.20.1`  
**Tile Source:** `https://tile.openstreetmap.org/{z}/{x}/{y}.png`

---

## Executive Summary

The app uses OpenStreetMap (OSM) tiles via `react-native-maps` `UrlTile` component. Several factors could prevent tiles from loading, ranging from network permissions to OSM usage policies.

---

## 1. Network Permissions & Configuration

### Issue: Missing Explicit Internet Permission

**Current State:**
- `app.json` Android permissions only include:
  - `READ_MEDIA_IMAGES`
  - `WRITE_EXTERNAL_STORAGE`
  - `CAMERA`
- **No `INTERNET` permission explicitly declared**

**Impact:**
- Android apps typically get `INTERNET` permission by default, but some devices/manufacturers may restrict it
- Expo Go may have additional network restrictions

**Evidence:**
```json
// app.json lines 58-62
"android": {
  "permissions": [
    "READ_MEDIA_IMAGES",
    "WRITE_EXTERNAL_STORAGE",
    "CAMERA"
  ]
}
```

**Recommendation:**
Add `INTERNET` permission explicitly:
```json
"android": {
  "permissions": [
    "INTERNET",
    "READ_MEDIA_IMAGES",
    "WRITE_EXTERNAL_STORAGE",
    "CAMERA"
  ]
}
```

---

## 2. Expo Go Limitations

### Issue: Native Module Restrictions in Expo Go

**Current State:**
- App runs in Expo Go (development mode)
- `react-native-maps` requires native configuration

**Impact:**
- Expo Go may not fully support all `react-native-maps` features
- `UrlTile` component might have limited support in Expo Go
- Native map providers may be restricted

**Evidence:**
- No custom native configuration found
- Using `PROVIDER_DEFAULT` which relies on platform defaults
- Expo Go sandbox may block external tile requests

**Recommendation:**
- Test in a development build (`expo prebuild` + native build)
- Consider using Expo's managed map solution if available
- Verify `react-native-maps` compatibility with Expo SDK 54

---

## 3. OpenStreetMap Usage Policy & Rate Limiting

### Issue: OSM Tile Usage Restrictions

**Current State:**
- Direct tile requests to `tile.openstreetmap.org`
- No User-Agent header configured
- No usage attribution visible in UI

**Impact:**
- OSM tile servers have strict usage policies:
  - **No heavy usage** (max 2 requests/second per IP)
  - **Requires User-Agent** identifying the application
  - **Requires attribution** to OpenStreetMap contributors
- Violations can result in IP blocking

**Evidence:**
```tsx
// src/components/pulse-map.tsx line 76-80
<UrlTile
  urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  maximumZ={19}
  flipY={false}
/>
```

**OSM Tile Usage Policy Requirements:**
1. ✅ **Attribution:** Not visible in current UI
2. ❌ **User-Agent:** Not configured
3. ❌ **Rate Limiting:** No throttling implemented
4. ❌ **Caching:** No tile caching strategy

**Recommendation:**
1. Add attribution text:
```tsx
<Text className="text-gray-500 text-xs mt-2">
  © OpenStreetMap contributors
</Text>
```

2. Use a tile proxy or alternative provider:
   - Mapbox (requires API key)
   - CartoDB (free tier available)
   - Self-hosted tile server
   - OSM tile proxy with proper headers

3. Implement tile caching to reduce requests

---

## 4. Network Security Configuration (Android)

### Issue: Cleartext Traffic Restrictions

**Current State:**
- Using HTTPS (`https://tile.openstreetmap.org`)
- No network security config defined

**Impact:**
- Android 9+ blocks cleartext HTTP by default (HTTPS should work)
- Some corporate networks block external tile requests
- Firewall/VPN may interfere

**Recommendation:**
- Verify HTTPS is working (OSM uses HTTPS)
- Check device network settings
- Test on different networks (WiFi vs cellular)

---

## 5. CORS & Cross-Origin Issues

### Issue: Web Platform CORS Restrictions

**Current State:**
- App targets iOS/Android (not web)
- But Expo can run on web platform

**Impact:**
- If running on web, OSM tiles may be blocked by CORS
- OSM tile servers may not allow cross-origin requests from web apps

**Evidence:**
```json
// app.json lines 11-14
"web": {
  "bundler": "metro",
  "output": "static",
  "favicon": "./assets/favicon.png"
}
```

**Recommendation:**
- For web platform, use a tile proxy or CORS-enabled tile service
- Consider disabling map on web or using alternative solution

---

## 6. React Native Maps Configuration

### Issue: Missing Native Configuration

**Current State:**
- Using `PROVIDER_DEFAULT`
- No custom map provider setup
- No API keys configured

**Impact:**
- Default provider may not support `UrlTile` on all platforms
- iOS/Android may have different behaviors

**Evidence:**
```tsx
// src/components/pulse-map.tsx line 67
provider={PROVIDER_DEFAULT}
```

**Recommendation:**
- For iOS: May need Google Maps API key or Apple Maps configuration
- For Android: May need Google Maps API key
- Consider using `PROVIDER_GOOGLE` with API key for better reliability

---

## 7. Error Handling & Debugging

### Issue: No Error Handling for Failed Tile Loads

**Current State:**
- No error boundaries around map component
- No loading states for tiles
- No fallback if tiles fail to load

**Impact:**
- Silent failures make debugging difficult
- Users see blank map with no indication of issue

**Evidence:**
```tsx
// No error handling in pulse-map.tsx
<MapView>
  <UrlTile urlTemplate="..." />
</MapView>
```

**Recommendation:**
Add error handling:
```tsx
const [tileError, setTileError] = useState(false);

// Add onError handler or check tile load status
// Show fallback UI if tiles fail
```

---

## 8. Device/Network-Specific Issues

### Potential Blockers:
1. **Corporate Firewalls:** May block tile.openstreetmap.org
2. **VPN/Proxy:** May interfere with tile requests
3. **Data Saver Mode:** May block image/tile downloads
4. **Parental Controls:** May restrict map content
5. **Regional Restrictions:** Some countries block OSM

---

## Diagnostic Steps

### 1. Check Network Connectivity
```bash
# Test if OSM tiles are accessible
curl -I https://tile.openstreetmap.org/0/0/0.png
```

### 2. Enable Debug Logging
Add to `pulse-map.tsx`:
```tsx
useEffect(() => {
  console.log('[PulseMap] Rendering map with', recent.length, 'pulses');
}, [recent]);
```

### 3. Check React Native Maps Logs
- Look for map initialization errors
- Check for tile request failures in device logs

### 4. Test on Different Platforms
- iOS device/simulator
- Android device/emulator
- Different network conditions

---

## Recommended Solutions (Priority Order)

### High Priority
1. ✅ **Add INTERNET permission** to `app.json`
2. ✅ **Add OSM attribution** to map component
3. ✅ **Add error handling** and loading states
4. ✅ **Test in development build** (not just Expo Go)

### Medium Priority
5. ⚠️ **Implement tile caching** to reduce requests
6. ⚠️ **Add User-Agent header** (if possible with UrlTile)
7. ⚠️ **Consider alternative tile provider** (Mapbox, CartoDB)

### Low Priority
8. 💡 **Add network connectivity check** before rendering map
9. 💡 **Implement fallback map style** (simple colored background)
10. 💡 **Add retry logic** for failed tile loads

---

## Alternative Tile Providers

If OSM continues to be blocked, consider:

1. **Mapbox:**
   - Requires API key
   - Free tier: 50,000 requests/month
   - Better reliability and support

2. **CartoDB:**
   - Free tier available
   - CORS-enabled
   - Good for web compatibility

3. **Self-Hosted Tiles:**
   - Use `tileserver-gl` or similar
   - Full control but requires hosting

4. **Static Map Image:**
   - Use Mapbox Static API
   - Single image instead of tiles
   - Simpler but less interactive

---

## Code Changes Required

### 1. Add Attribution (Required by OSM)
```tsx
// In pulse-map.tsx, after MapView
<Text className="text-gray-500 text-xs mt-2 text-center">
  © OpenStreetMap contributors
</Text>
```

### 2. Add INTERNET Permission
```json
// app.json
"android": {
  "permissions": [
    "INTERNET",  // Add this
    "READ_MEDIA_IMAGES",
    "WRITE_EXTERNAL_STORAGE",
    "CAMERA"
  ]
}
```

### 3. Add Error Handling
```tsx
const [mapError, setMapError] = useState(false);

// Wrap MapView with error boundary or add onError handler
```

---

## Conclusion

The most likely causes of OpenStreetMap blocking are:
1. **Missing INTERNET permission** (Android)
2. **Expo Go limitations** with native map modules
3. **OSM rate limiting** due to missing User-Agent/attribution
4. **Network restrictions** (firewall, VPN, corporate network)

**Immediate Action:** Add INTERNET permission and OSM attribution, then test in a development build rather than Expo Go.

---

**Report Generated:** Analysis of `src/components/pulse-map.tsx` and app configuration  
**Last Updated:** Current session


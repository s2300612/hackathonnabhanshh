# Album Handling Report
## Camera+ Application - Media Library Implementation Analysis

**Date:** Generated Report  
**Application:** Drawio Resizer — Camera+  
**Album Name:** `NabhanCamera`

---

## Executive Summary

The application implements a **dual-source album system** that combines device album access with a local MobX fallback store. The system is designed to handle platform-specific permission limitations, particularly on Android/Expo Go where read permissions may be restricted.

---

## 1. Album Architecture

### 1.1 Dual-Source System

The album screen (`src/app/(app)/album.tsx`) uses a **two-tier approach**:

1. **Primary Source: Device Album** (`deviceShots`)
   - Reads from the device's `NabhanCamera` album via `expo-media-library`
   - Requires READ permission
   - Shows up to 200 photos sorted by creation time (newest first)

2. **Fallback Source: MobX Store** (`camera.recent`)
   - Local in-memory store persisted to AsyncStorage
   - Contains recently captured photos (last 100, deduped by URI)
   - Always available regardless of permissions

### 1.2 Data Flow

```
┌─────────────────┐
│  Camera Capture │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MobX Store     │ ← Always saves URI
│  (camera.recent)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Photo Editor   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Export Action  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ Gallery│ │ NabhanCamera │
│ (base) │ │   Album      │
└────────┘ └──────────────┘
```

---

## 2. Permission Handling

### 2.1 Implementation (`src/lib/camera-permissions.ts`)

The permission system uses platform-specific logic:

```typescript
export async function requestMediaPermission(): Promise<MediaPerm> {
  if (Platform.OS === "ios") {
    const p = await MediaLibrary.requestPermissionsAsync();
    return { canRead: p.granted, canWrite: p.granted };
  }
  // Android/Expo Go
  const p = await MediaLibrary.requestPermissionsAsync(true);
  return { canRead: p.granted, canWrite: p.granted };
}
```

### 2.2 Platform Differences

| Platform | Read Permission | Write Permission | Notes |
|----------|----------------|------------------|-------|
| **iOS** | ✅ Single dialog grants both | ✅ Single dialog grants both | Unified permission model |
| **Android (Expo Go)** | ❌ Often denied | ✅ Usually granted | `requestPermissionsAsync(true)` requests write-only |
| **Android (Standalone)** | ⚠️ Depends on manifest | ✅ Usually granted | May require additional manifest permissions |

### 2.3 Permission Request Flow

1. **On Album Screen Load:**
   ```typescript
   useEffect(() => {
     (async () => {
       const mp = await requestMediaPermission();
       setCanRead(!!mp.canRead);
       if (mp.canRead) await load();
     })();
   }, [load]);
   ```

2. **On Export:**
   ```typescript
   const { canWrite, canRead } = await requestMediaPermission();
   if (!canWrite) throw new Error("Write permission required");
   // Album operations only if canRead is true
   ```

---

## 3. Album Operations

### 3.1 Reading Album (`album.tsx` - `load()` function)

```typescript
const load = useCallback(async () => {
  try {
    // 1. Get album reference
    const album = await MediaLibrary.getAlbumAsync(ALBUM);
    if (!album) { 
      setDeviceShots([]); 
      return; // Album doesn't exist yet
    }
    
    // 2. Fetch assets
    const result = await MediaLibrary.getAssetsAsync({
      album, 
      mediaType: ["photo"], 
      first: 200, 
      sortBy: [["creationTime", false]]
    });
    
    // 3. Process and deduplicate
    const list = result.assets
      .map(a => ({ id: String(a.id), uri: String(a.uri) }))
      .filter(x => x.uri.length > 0);
    const uniq = new Map(list.map(x => [x.id, x]));
    setDeviceShots(Array.from(uniq.values()));
  } catch (e: any) {
    console.warn("Album load error", e?.message ?? e);
    Alert.alert("Album error", "Unable to read the device album.");
  }
}, []);
```

### 3.2 Writing to Album (`photo.tsx` - `onExport()` function)

```typescript
// 1. Create asset from snapshot
const asset = await MediaLibrary.createAssetAsync(uri);

// 2. Add to album (only if read permission available)
if (canRead) {
  let album = await MediaLibrary.getAlbumAsync(ALBUM);
  if (!album) {
    // Create album if it doesn't exist
    album = await MediaLibrary.createAlbumAsync(ALBUM, asset, false);
  } else {
    // Add to existing album
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  }
}
```

**Note:** Photos are **always saved to the base gallery** via `createAssetAsync()`. Album organization is **optional** and only occurs if read permission is available.

---

## 4. Error Causes & Scenarios

### 4.1 Permission-Related Errors

#### Error: "Unable to read the device album"

**Causes:**
1. **READ permission denied** (most common on Android/Expo Go)
   - `requestPermissionsAsync(true)` on Android requests write-only
   - User may have denied read permission in system settings
   - Expo Go limitations on Android 13+

2. **Permission not requested**
   - App hasn't requested permissions yet
   - User dismissed permission dialog

3. **Permission revoked**
   - User revoked permission in system settings after initial grant

**Impact:**
- `canRead` is set to `false`
- Album screen falls back to MobX `camera.recent` store
- Device album operations are skipped
- Photos still save to gallery, but not organized into album

**User Experience:**
- Shows message: "Grant Photos/Media permission for Expo Go, then reopen this tab"
- Still shows recent photos from MobX store
- Export still works (uses write permission)

### 4.2 Album Not Found Errors

#### Scenario: Album doesn't exist

**Cause:**
```typescript
const album = await MediaLibrary.getAlbumAsync(ALBUM);
if (!album) { setDeviceShots([]); return; }
```

**When this happens:**
- First time user exports a photo
- Album was manually deleted by user
- Album creation failed previously

**Resolution:**
- Album is automatically created on first export (if `canRead` is true)
- If `canRead` is false, photos save to gallery but not to album

### 4.3 MediaLibrary API Errors

#### Potential API failures:

1. **`getAlbumAsync()` throws**
   - Network issues (unlikely for local storage)
   - Corrupted media database
   - System-level media service unavailable

2. **`getAssetsAsync()` throws**
   - Invalid album reference
   - Permission revoked mid-operation
   - Media database locked by another process

3. **`createAssetAsync()` throws**
   - Invalid file URI
   - Insufficient storage space
   - File system permissions issue

**Error Handling:**
```typescript
catch (e: any) {
  console.warn("Album load error", e?.message ?? e);
  Alert.alert("Album error", "Unable to read the device album.");
}
```

### 4.4 Platform-Specific Issues

#### Android/Expo Go Limitations

1. **Scoped Storage (Android 10+)**
   - Apps can only access their own media files
   - Reading other apps' media requires special permissions
   - Expo Go may have additional restrictions

2. **Android 13+ Photo Picker**
   - New permission model separates read/write
   - `READ_MEDIA_IMAGES` permission required for reading
   - May not be fully supported in Expo Go

3. **Expo Go Sandbox**
   - Expo Go runs in a sandboxed environment
   - May have limited access to system media APIs
   - Some permissions may not be requestable

#### iOS Limitations

1. **Photo Library Access Levels**
   - iOS 14+ introduces "Limited Photo Library Access"
   - User may grant access to specific photos only
   - Full library access requires explicit permission

2. **Privacy Settings**
   - User can revoke permissions in Settings
   - App must handle permission state changes gracefully

---

## 5. Fallback Mechanism

### 5.1 MobX Store Fallback

When device album read fails, the app uses `camera.recent` from MobX:

```typescript
const allShots = useMemo(() => {
  if (canRead && deviceShots.length > 0) {
    return deviceShots; // Prefer device album
  }
  return camera.recent; // Fallback to MobX
}, [canRead, deviceShots, camera.recent]);
```

**Advantages:**
- Always shows recently captured photos
- No permission required
- Fast access (in-memory)
- Persisted to AsyncStorage

**Limitations:**
- Only shows photos captured in current app session
- Limited to last 100 photos
- Doesn't show photos exported from other sources
- May show duplicates if same photo captured multiple times

### 5.2 Data Persistence

MobX store uses `mobx-persist-store` with AsyncStorage:
- Persists `recent` array across app restarts
- Storage key: `CameraStore.v1`
- Automatically syncs on state changes

---

## 6. Recommendations

### 6.1 Error Prevention

1. **Request permissions early**
   - Request on app launch or first camera use
   - Show clear explanation of why permissions are needed

2. **Handle permission state changes**
   - Listen for permission revocation
   - Re-request permissions when needed
   - Gracefully degrade functionality

3. **Better error messages**
   - Distinguish between "permission denied" vs "album not found"
   - Provide actionable steps for users
   - Link to system settings if possible

### 6.2 Code Improvements

1. **Add permission status checking**
   ```typescript
   const checkPermissionStatus = async () => {
     const status = await MediaLibrary.getPermissionsAsync();
     return status.granted;
   };
   ```

2. **Retry logic for transient errors**
   - Retry album operations on failure
   - Exponential backoff for network/system errors

3. **Better album creation handling**
   - Check if album exists before creating
   - Handle album creation failures gracefully

### 6.3 User Experience

1. **Clear permission prompts**
   - Explain why read permission is needed
   - Show benefits of album organization
   - Provide alternative if permission denied

2. **Status indicators**
   - Show permission status in UI
   - Indicate when using fallback store
   - Display album sync status

3. **Manual refresh option**
   - Allow users to manually reload album
   - Provide "Request Permission" button
   - Show permission request dialog on demand

---

## 7. Testing Scenarios

### 7.1 Permission Scenarios

- [ ] First launch (no permissions)
- [ ] Permission granted (read + write)
- [ ] Permission denied (read only)
- [ ] Permission revoked after grant
- [ ] Permission granted but album doesn't exist

### 7.2 Platform Testing

- [ ] iOS with full permission
- [ ] iOS with limited permission
- [ ] Android/Expo Go with write-only
- [ ] Android standalone build
- [ ] Android 13+ with new permission model

### 7.3 Error Scenarios

- [ ] Album doesn't exist
- [ ] Album exists but empty
- [ ] MediaLibrary API throws error
- [ ] Network/storage unavailable
- [ ] Corrupted media database

---

## 8. Conclusion

The album handling system is **robust** with a good fallback mechanism, but has **platform-specific limitations**:

**Strengths:**
- ✅ Dual-source system ensures photos are always viewable
- ✅ Graceful degradation when permissions are limited
- ✅ Automatic album creation
- ✅ Persistent local store

**Weaknesses:**
- ⚠️ Android/Expo Go read permission limitations
- ⚠️ Limited error differentiation
- ⚠️ No manual permission re-request option
- ⚠️ Fallback store doesn't sync with device album

**Primary Error Cause:**
The most common cause of "Unable to read the device album" is **READ permission denial on Android/Expo Go**, where the permission system only grants write access by default. This is a platform limitation, not a code bug, and the app handles it gracefully by falling back to the MobX store.

---

## Appendix: Code References

- **Album Screen:** `src/app/(app)/album.tsx`
- **Permission Helper:** `src/lib/camera-permissions.ts`
- **Export Logic:** `src/app/(app)/photo.tsx` (lines 85-163)
- **MobX Store:** `src/stores/camera-store.ts`
- **Album Constant:** `ALBUM = "NabhanCamera"`

---

**Report Generated:** $(date)  
**Application Version:** 1.0.0  
**Expo SDK:** 54.0.0


# Image Storage and Export Analysis Report

## Executive Summary

This report analyzes how the Camera+ app stores images and identifies potential causes of blank photos and export failures. The app uses a dual-storage approach: **metadata in AsyncStorage** (via MobX persistence) and **actual image files in temporary file system locations** until export.

---

## 1. Image Storage Architecture

### 1.1 Storage Layers

#### **Layer 1: Temporary File System (Actual Images)**
- **Location**: Device temporary storage (via `expo-camera` and `react-native-view-shot`)
- **Format**: 
  - Raw captures: JPG (`quality: 0.9`, `skipProcessing: true`)
  - Baked images: JPG (`format: "jpg"`, `quality: 0.92`, `result: "tmpfile"`)
- **URIs**: 
  - Raw: `file://` or `content://` URIs from `takePictureAsync()`
  - Baked: Temporary file URIs from `ViewShot.captureRef()`

#### **Layer 2: MobX Store + AsyncStorage (Metadata Only)**
- **Location**: `AsyncStorage` key `"CameraStore.v1"`
- **Storage**: Via `mobx-persist-store` with `stringify: true`
- **Data Structure**:
```typescript
type Shot = {
  id: string;                    // Generated: `${Date.now()}_${random}`
  uri: string;                   // Raw camera capture URI
  bakedUri?: string;             // Baked effect URI (if look !== "none")
  look?: "none" | "night" | "thermal" | "tint";
  tint?: string;                 // Hex color code
  alpha?: number;                // 0..1 opacity
  createdAt: number;             // Timestamp
}
```
- **Limits**: Maximum 100 recent shots (`.slice(0, 100)`)
- **Persistence**: Automatically persisted on every `pushLocal()` call

#### **Layer 3: System Media Library (After Export)**
- **Location**: Device photo gallery
- **Album**: `"NabhanCamera"` (created if doesn't exist)
- **Format**: JPG via `MediaLibrary.createAssetAsync()`
- **Permission**: Requires `MediaLibrary.write` permission

---

## 2. Image Capture and Baking Flow

### 2.1 Capture Sequence (`camera-advanced.tsx`)

```
1. User taps shutter
   ↓
2. takePictureAsync() → raw URI (temporary file)
   ↓
3. setRawUri(pic.uri) → triggers OffscreenComposer re-render
   ↓
4. Wait 2x requestAnimationFrame (for render)
   ↓
5. If look !== "none":
   - captureRef(bakeRef) → baked URI (temporary file)
   - Fallback: bakedUri = pic.uri if capture fails
   ↓
6. pushFallback() → stores metadata in MobX/AsyncStorage
   ↓
7. Navigate to Viewer with shot.id or bakedUri
```

### 2.2 Offscreen Composer (`OffscreenComposer.tsx`)

- **Purpose**: Hidden ViewShot tree that bakes effects into images
- **Location**: Absolutely positioned off-screen (`left: -9999, top: -9999`)
- **Rendering**:
  - Base `<Image>` with `resizeMode: "cover"`
  - Overlays: tint (View), night (View), thermal (LinearGradient)
  - Calls `onReady()` when base image `onLoad` fires

### 2.3 Export Flow (`photo.tsx`)

```
1. User taps Export
   ↓
2. Check permissions (canWrite)
   ↓
3. If look === "none":
   - Direct save: MediaLibrary.createAssetAsync(baseUri)
   ↓
4. If look !== "none":
   - Wait for imgReady (or 50ms timeout)
   - viewShotRef.current?.capture() → captured URI
   - If capture fails → fallback to baseUri
   ↓
5. Save to gallery + update history
```

---

## 3. Potential Causes of Blank Photos

### 3.1 **Timing Issues**

#### **Issue: ViewShot Captures Before Image Loads**
- **Location**: `camera-advanced.tsx:68` and `photo.tsx:216-219`
- **Risk**: High
- **Current Mitigation**:
  - Camera: 2x `requestAnimationFrame` wait
  - Editor: `imgReady` state + 50ms timeout fallback
- **Remaining Risk**: If `OffscreenComposer.onReady` isn't called, camera capture may still be premature

#### **Issue: OffscreenComposer Image Not Ready**
- **Location**: `OffscreenComposer.tsx:30`
- **Risk**: Medium
- **Current Behavior**: `onLoad` calls `onReady()` directly
- **Problem**: If image fails to load or URI is invalid, `onReady` never fires
- **Impact**: Camera capture may capture black/blank frame

### 3.2 **URI Resolution Issues**

#### **Issue: Temporary File Cleanup**
- **Location**: All temporary file URIs
- **Risk**: High
- **Problem**: 
  - Temporary files (`result: "tmpfile"`) may be cleaned up by OS
  - URIs become invalid after app restart or system cleanup
  - No validation that URI still exists before use
- **Impact**: Viewer/Album shows blank/black when URI is stale

#### **Issue: URI Format Inconsistencies**
- **Location**: `viewer.tsx:15-20`, `album.tsx:186-193`
- **Risk**: Medium
- **Problem**: 
  - Android: `content://` vs `file://` URIs
  - iOS: `file://` URIs
  - Some URIs may not be compatible with `expo-image` or `Image` component
- **Impact**: Image fails to load, shows blank

### 3.3 **ViewShot Capture Failures**

#### **Issue: View Collapsed or Not Rendered**
- **Location**: `camera-advanced.tsx:159-170`, `photo.tsx:305-315`
- **Risk**: Medium
- **Current Mitigation**: 
  - `collapsable={false}` on ViewShot and wrapper View
  - Hidden offscreen tree positioned absolutely
- **Remaining Risk**: Android may still collapse views in certain conditions

#### **Issue: ViewShot Options Not Applied**
- **Location**: `photo.tsx:221`
- **Risk**: Low
- **Problem**: `viewShotRef.current?.capture?.()` called without explicit options
- **Current Behavior**: Uses options from ViewShot component props
- **Impact**: If options aren't set correctly, capture may fail or produce wrong format

### 3.4 **State Management Issues**

#### **Issue: Stale bakedUri in Store**
- **Location**: `camera-store.ts:77-94`
- **Risk**: Medium
- **Problem**: 
  - If `pushLocal()` is called before `bakedUri` is ready, stores `undefined`
  - No validation that `bakedUri` exists before storing
  - Viewer may try to display non-existent URI
- **Impact**: Viewer shows blank when `bakedUri` is undefined but expected

#### **Issue: Race Condition in Capture**
- **Location**: `camera-advanced.tsx:66-78`
- **Risk**: Medium
- **Problem**: 
  - `setRawUri()` triggers re-render
  - Capture happens after 2 RAFs, but `OffscreenComposer` may not have loaded image yet
  - No explicit wait for `onReady` callback
- **Impact**: May capture before image is painted

---

## 4. Potential Export Failures

### 4.1 **Permission Issues**

#### **Issue: Write Permission Not Granted**
- **Location**: `photo.tsx:191-195`
- **Risk**: High
- **Current Behavior**: Shows alert, returns early
- **Impact**: Export silently fails, user sees "Exporting..." spinner that never completes (if `setExporting(false)` isn't called)

#### **Issue: Permission Check Timing**
- **Location**: `photo.tsx:191`
- **Risk**: Low
- **Problem**: Permission checked inside `doExport`, but if denied, function returns without clearing `exporting` state
- **Impact**: Button stuck in "Exporting..." state

### 4.2 **File System Issues**

#### **Issue: Temporary File Deleted**
- **Location**: `photo.tsx:197-212` (direct save path)
- **Risk**: High
- **Problem**: 
  - `baseUri` may point to temporary file that was cleaned up
  - No validation that file exists before `createAssetAsync()`
- **Impact**: Export fails with file not found error

#### **Issue: Invalid URI Format for MediaLibrary**
- **Location**: `photo.tsx:199`, `photo.tsx:225`, `photo.tsx:234`
- **Risk**: Medium
- **Problem**: 
  - `MediaLibrary.createAssetAsync()` may reject certain URI formats
  - No URI validation before attempting save
- **Impact**: Export throws error, caught by catch block

### 4.3 **ViewShot Capture Failures**

#### **Issue: Capture Returns Null/Undefined**
- **Location**: `photo.tsx:221`
- **Risk**: Medium
- **Current Mitigation**: Falls back to `baseUri` if capture fails
- **Remaining Risk**: If `baseUri` is also invalid, export still fails

#### **Issue: Capture Throws Exception**
- **Location**: `photo.tsx:221`
- **Risk**: Low
- **Current Behavior**: Not wrapped in try/catch (relies on outer catch)
- **Impact**: If capture throws, falls through to error handler

### 4.4 **State Management Issues**

#### **Issue: Exporting State Not Cleared**
- **Location**: `photo.tsx:264` (finally block)
- **Risk**: Low (mitigated)
- **Current Behavior**: `finally` block always clears `exporting`
- **Remaining Risk**: If permission check returns early, `exporting` may not be cleared (line 194)

#### **Issue: Image Not Ready When Exporting**
- **Location**: `photo.tsx:216-219`
- **Risk**: Medium
- **Current Behavior**: 
  - Button disabled when `!imgReady`
  - 50ms wait if `!imgReady` when export starts
- **Remaining Risk**: 50ms may not be enough on slow devices

---

## 5. Critical Failure Points

### 5.1 **High Priority Issues**

1. **Temporary File Cleanup**
   - **Impact**: Blank photos in Viewer/Album after app restart
   - **Likelihood**: High on Android, medium on iOS
   - **Recommendation**: Validate URI exists before display, or copy to permanent location

2. **Permission Check Early Return**
   - **Impact**: Export button stuck in "Exporting..." state
   - **Likelihood**: Medium (only if permission denied)
   - **Recommendation**: Clear `exporting` state before returning from permission check

3. **No Wait for OffscreenComposer.onReady in Camera**
   - **Impact**: Blank baked images on capture
   - **Likelihood**: Medium (timing-dependent)
   - **Recommendation**: Wait for `onReady` callback before capturing

### 5.2 **Medium Priority Issues**

4. **URI Format Validation**
   - **Impact**: Images fail to load in Viewer/Album
   - **Likelihood**: Low-Medium (platform-dependent)
   - **Recommendation**: Validate URI format and existence before use

5. **Stale bakedUri in Store**
   - **Impact**: Viewer shows blank when expecting baked image
   - **Likelihood**: Low (only if capture fails silently)
   - **Recommendation**: Validate `bakedUri` exists before storing

6. **ViewShot Capture Without Options**
   - **Impact**: Wrong format or quality in exported image
   - **Likelihood**: Low (options are set on component)
   - **Recommendation**: Pass explicit options to `capture()` call

---

## 6. Recommendations

### 6.1 **Immediate Fixes**

1. **Fix Permission Check Early Return**
   ```typescript
   if (!canWrite) {
     setExporting(false); // ← Add this
     Alert.alert("Photos permission needed", "...");
     return;
   }
   ```

2. **Add URI Validation Before Display**
   ```typescript
   import * as FileSystem from "expo-file-system";
   
   const validateUri = async (uri: string) => {
     try {
       const info = await FileSystem.getInfoAsync(uri);
       return info.exists;
     } catch {
       return false;
     }
   };
   ```

3. **Wait for OffscreenComposer.onReady in Camera**
   ```typescript
   const [composerReady, setComposerReady] = useState(false);
   
   // In takePhoto, after setRawUri:
   setComposerReady(false);
   // Wait for onReady callback
   let waited = 0;
   while (!composerReady && waited < 2000) {
     await new Promise(r => setTimeout(r, 50));
     waited += 50;
   }
   ```

### 6.2 **Long-term Improvements**

1. **Copy Temporary Files to Permanent Location**
   - Store baked images in app's document directory
   - Use `FileSystem.copyAsync()` after capture
   - Update URIs in store to point to permanent location

2. **Add Retry Logic for ViewShot Capture**
   - Retry up to 3 times with increasing delays
   - Validate captured file size before accepting

3. **Implement Image Cache/Validation Layer**
   - Check URI validity before displaying
   - Show placeholder or error message if invalid
   - Attempt to reload from raw URI if baked fails

4. **Add Export Progress Feedback**
   - Show determinate progress (0-100%)
   - Stage-based progress: prepare → capture → save
   - Clear error messages if export fails

---

## 7. Current Safeguards

### 7.1 **Working Safeguards**

✅ **Finally Block**: Always clears `exporting` state (except permission early return)  
✅ **Fallback to Base**: If capture fails, saves `baseUri` instead  
✅ **imgReady State**: Prevents export until image loads  
✅ **collapsable={false}**: Prevents Android view collapse  
✅ **Direct Save Path**: When `look === "none"`, skips capture entirely  

### 7.2 **Missing Safeguards**

❌ **URI Validation**: No check that file exists before use  
❌ **Permission Early Return**: Doesn't clear `exporting` state  
❌ **OffscreenComposer Ready Wait**: Camera doesn't wait for `onReady`  
❌ **Capture Retry**: No retry logic if capture fails  
❌ **File Size Validation**: No check that captured file is valid  

---

## 8. Testing Scenarios

### 8.1 **Test Cases for Blank Photos**

1. **Capture with Tint → Immediately View**
   - Expected: Tinted image visible
   - Failure: Black/blank screen
   - Root Cause: ViewShot captured before image loaded

2. **Capture → Close App → Reopen → View**
   - Expected: Image still visible
   - Failure: Blank screen
   - Root Cause: Temporary file cleaned up

3. **Capture with Effect → Export Without Edits**
   - Expected: Baked image saved
   - Failure: Blank/black exported image
   - Root Cause: Direct save of invalid `baseUri`

### 8.2 **Test Cases for Export Failures**

1. **Export with Permission Denied**
   - Expected: Alert shown, button re-enabled
   - Failure: Button stuck in "Exporting..." state
   - Root Cause: Early return without clearing state

2. **Export with Effect → Capture Fails**
   - Expected: Falls back to base image
   - Failure: Export fails completely
   - Root Cause: `baseUri` also invalid

3. **Export Immediately After Opening Editor**
   - Expected: Waits for image, then exports
   - Failure: Blank exported image
   - Root Cause: 50ms timeout not enough

---

## 9. Conclusion

The app's image storage architecture is **functional but fragile**. The main risks are:

1. **Temporary file cleanup** causing blank photos after app restart
2. **Timing issues** causing blank captures if ViewShot fires too early
3. **Permission early return** causing stuck export button
4. **No URI validation** causing silent failures

The current safeguards (fallbacks, `imgReady` state, `finally` blocks) mitigate most issues, but **URI validation** and **explicit ready-state waiting** would significantly improve reliability.

---

**Report Generated**: $(date)  
**Codebase Version**: Current as of latest changes  
**Files Analyzed**: 
- `src/stores/camera-store.ts`
- `src/lib/camera-permissions.ts`
- `src/app/(app)/camera-advanced.tsx`
- `src/app/(app)/photo.tsx`
- `src/app/(app)/viewer.tsx`
- `src/components/OffscreenComposer.tsx`


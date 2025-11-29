# Image Baking and Tinting Process - Issue Report

## Executive Summary

The editor displays a **black screen** when editing photos with baked tints/effects, while photos without effects work correctly. This indicates a problem in the image baking pipeline where the baked image URI is either invalid, inaccessible, or the baking process is failing silently.

---

## Current Architecture

### 1. Camera Capture Flow (with Tint)

**Location:** `src/app/(app)/camera-advanced.tsx`

**Process:**
1. User takes photo → `camRef.current.takePictureAsync()` → `pic.uri` (raw image)
2. If `look !== "none"`:
   - Sets `rawUri` state and `rawUriRef.current = pic.uri`
   - Waits for `OffscreenComposer` to be ready via `waitForComposerReady()`
   - Captures baked image: `captureRef(bakeRef, { format: "jpg", quality: 0.92, result: "tmpfile" })`
   - Result: `bakedUri = tmp ?? pic.uri` (falls back to raw if capture fails)
3. Saves to camera store: `pushFallback({ uri: pic.uri, bakedUri, look, tint, alpha })`
4. Navigates to viewer with `shot.id` or `{ uri: bakedUri }`

**Key Code:**
```typescript
let bakedUri = pic.uri;
if (look !== "none" && bakeRef.current) {
  await waitForComposerReady();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise(r => setTimeout(r, 80));
  
  const tmp = await captureRef(bakeRef, { format: "jpg", quality: 0.92, result: "tmpfile" }).catch(() => null);
  bakedUri = tmp ?? pic.uri;
}
```

### 2. OffscreenComposer Component

**Location:** `src/components/OffscreenComposer.tsx`

**Structure:**
- Hidden `ViewShot` wrapper (positioned off-screen)
- Base `Image` component with `onLoad` callback
- Overlay layers (tint/night/thermal) with opacity control
- `onReady` callback fires after: `RAF → RAF → setTimeout(50)`

**Potential Issues:**
- Uses React Native `Image` (not `ExpoImage`) - may have URI compatibility issues
- `onReady` timing might be too early (overlay might not be painted yet)
- No validation that the captured file is valid before using it

### 3. Viewer → Editor Flow

**Location:** `src/app/(app)/viewer.tsx` → `src/app/(app)/photo.tsx`

**Process:**
1. Viewer gets: `base = shot?.bakedUri ?? shot?.uri`
2. Viewer displays: `<ExpoImage source={{ uri: base }} />` ✅ **Works**
3. User presses "Edit" → passes: `sourceUri: base`
4. Editor receives: `baseUri = sourceUri || bakedParam`
5. Editor displays: `<ExpoImage source={{ uri: baseUri }} />` ❌ **Black screen**

**Observation:** Same URI works in viewer but not in editor.

---

## Identified Issues

### Issue 1: Temporary File Lifecycle
**Severity:** HIGH

**Problem:**
- `captureRef` with `result: "tmpfile"` creates a temporary file
- Temporary files may be cleaned up by the system before the editor accesses them
- No explicit persistence of the baked image to a permanent location

**Evidence:**
- Photos without effects work (use `pic.uri` which is a permanent camera file)
- Photos with effects fail (use `bakedUri` which is a temporary file)

**Location:** `camera-advanced.tsx:101`

### Issue 2: OffscreenComposer Image Loading
**Severity:** MEDIUM

**Problem:**
- Uses React Native `Image` component instead of `ExpoImage`
- May not handle all URI formats correctly (especially `file://` URIs from camera)
- `onReady` callback might fire before the overlay is fully rendered

**Location:** `OffscreenComposer.tsx:45-49`

### Issue 3: No File Validation After Capture
**Severity:** MEDIUM

**Problem:**
- `captureRef` result is used without validation
- No check that the file exists and has valid content
- Silent failure: `bakedUri = tmp ?? pic.uri` falls back silently

**Location:** `camera-advanced.tsx:101-102`

### Issue 4: Editor URI Resolution
**Severity:** LOW

**Problem:**
- Editor uses `baseUri = sourceUri || bakedParam`
- If `bakedUri` is invalid, editor should fall back to `shot.uri` (raw image)
- Currently relies on viewer passing the correct URI

**Location:** `photo.tsx:173`

---

## Root Cause Analysis

### Primary Hypothesis: Temporary File Deletion

The most likely cause is that the temporary file created by `captureRef` is deleted or becomes inaccessible before the editor tries to load it. This would explain:

1. ✅ Viewer works (loads immediately after capture)
2. ❌ Editor fails (loads later, file may be gone)
3. ✅ Photos without effects work (use permanent camera file)

### Secondary Hypothesis: URI Format Incompatibility

The `bakedUri` might be in a format that `ExpoImage` in the editor cannot handle, even though it works in the viewer. This could be due to:
- Different rendering contexts (viewer vs editor)
- Different URI resolution timing
- Cache/state differences

---

## Recommended Fixes

### Fix 1: Persist Baked Images to Cache Directory (HIGH PRIORITY)

**Action:** Copy the temporary baked file to a permanent location in the cache directory before saving to camera store.

**Implementation:**
```typescript
// In camera-advanced.tsx, after captureRef:
if (tmp) {
  // Copy to permanent cache location
  const filename = `baked_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const permanentUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.copyAsync({ from: tmp, to: permanentUri });
  bakedUri = permanentUri;
}
```

**Benefits:**
- Baked images persist across app sessions
- Editor can reliably access the file
- No dependency on temporary file lifecycle

### Fix 2: Validate Captured File (MEDIUM PRIORITY)

**Action:** Verify the captured file exists and has valid content before using it.

**Implementation:**
```typescript
const fileOk = async (uri?: string, min = 3000) => {
  if (!uri) return false;
  try {
    const i = await FileSystem.getInfoAsync(uri);
    return !!i.exists && (i.size ?? 0) > min;
  } catch {
    return false;
  }
};

// After captureRef:
if (tmp && await fileOk(tmp)) {
  bakedUri = tmp;
} else {
  console.warn("[CAMERA] Baked capture failed, using raw image");
  bakedUri = pic.uri;
}
```

**Benefits:**
- Early detection of capture failures
- Better error logging
- Graceful fallback to raw image

### Fix 3: Use ExpoImage in OffscreenComposer (LOW PRIORITY)

**Action:** Replace React Native `Image` with `ExpoImage` for better URI compatibility.

**Implementation:**
```typescript
// In OffscreenComposer.tsx
import { Image as ExpoImage } from "expo-image";

<ExpoImage
  source={{ uri }}
  style={{ width, height }}
  contentFit="cover"
  onLoad={handleLoad}
  onError={() => { setLoaded(true); onReady?.(); }}
/>
```

**Benefits:**
- Better URI format support
- Consistent with viewer/editor
- More reliable image loading

### Fix 4: Editor Fallback to Raw Image (MEDIUM PRIORITY)

**Action:** If `bakedUri` fails to load, fall back to `shot.uri` (raw image).

**Implementation:**
```typescript
// In photo.tsx, when loading fails:
const [fallbackUri, setFallbackUri] = useState<string | null>(null);

// In onError handler:
onError={(e) => {
  console.warn("[EDITOR] Baked image failed, trying raw:", baseUri);
  // Try to get raw URI from camera store
  const shot = camera.recent.find(s => s.bakedUri === baseUri);
  if (shot?.uri) {
    setFallbackUri(shot.uri);
  }
}}
```

**Benefits:**
- Editor always shows something (even if baked image fails)
- Better user experience
- Graceful degradation

---

## Testing Plan

### Test Case 1: Baked Image Persistence
1. Take photo with tint
2. Close app
3. Reopen app
4. Navigate to album
5. Open photo
6. Press "Edit"
7. **Expected:** Image displays correctly

### Test Case 2: Baked Image Validation
1. Take photo with tint
2. Check console logs for file validation
3. Navigate to viewer
4. Press "Edit"
5. **Expected:** No errors, image displays

### Test Case 3: Fallback Behavior
1. Take photo with tint
2. Manually delete baked file (if possible)
3. Navigate to viewer
4. Press "Edit"
5. **Expected:** Falls back to raw image or shows error message

---

## Conclusion

The black screen issue is most likely caused by **temporary file lifecycle problems** where the baked image file is deleted or becomes inaccessible before the editor loads it. The recommended fix is to **persist baked images to the cache directory** and **validate files before use**.

The secondary issue is the lack of **fallback mechanisms** in the editor when the baked image fails to load. Implementing a fallback to the raw image would improve user experience.

---

## Files to Modify

1. **`src/app/(app)/camera-advanced.tsx`**
   - Add file persistence after `captureRef`
   - Add file validation before using `bakedUri`

2. **`src/components/OffscreenComposer.tsx`** (optional)
   - Replace `Image` with `ExpoImage`

3. **`src/app/(app)/photo.tsx`** (optional)
   - Add fallback to raw image on load failure

---

**Report Generated:** $(date)
**Status:** Pending Implementation


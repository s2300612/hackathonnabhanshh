# Image Display and Capture Report

## Executive Summary

This report documents the issues with image display in the Viewer and Editor, and identifies that the Camera is incorrectly taking screenshots during capture instead of only during export.

## Current Issues

### Issue 1: Camera Takes Screenshot on Capture (Not Just Export)

**Location**: `src/app/(app)/camera-advanced.tsx`

**Problem**: 
- When the shutter button is pressed, the camera is calling `captureRef(previewShotRef)` to take a screenshot of the preview with overlays (lines 66-88)
- This screenshot is then passed to the viewer as `bakedUri`
- The user only wants screenshots during export, not during capture

**Current Code Flow**:
```typescript
const takePhoto = useCallback(async () => {
  // 1. Take actual camera photo
  const pic = await camRef.current.takePictureAsync({ quality: 0.9, skipProcessing: true });
  
  // 2. Take screenshot of preview (UNWANTED)
  if (previewShotRef.current) {
    const captured = await captureRef(previewShotRef, { format: "jpg", quality: 0.92, result: "data-uri" });
    if (captured && captured.startsWith('data:')) {
      bakedUri = captured; // Screenshot passed as baked image
    }
  }
  
  // 3. Navigate to viewer with screenshot
  router.replace({ pathname: "/(app)/viewer", params: { uri: bakedUri, raw: pic.uri } });
}, []);
```

**Expected Behavior**:
- Camera should only take the actual photo using `takePictureAsync`
- Effects should be applied in the viewer/editor, not baked during capture
- Screenshots should only be taken when exporting

### Issue 2: Viewer Shows Black Screen

**Location**: `src/app/(app)/viewer.tsx`

**Problem**:
- Viewer receives a data URI from camera (from the unwanted screenshot)
- Data URIs might be too large or malformed
- The `ExpoImage` component might not be handling the data URI correctly

**Current Code**:
```typescript
const base = shot?.bakedUri ?? shot?.uri ?? (typeof params.uri === "string" ? params.uri : undefined);

<ExpoImage
  source={{ uri: base }}
  style={styles.image}
  contentFit="contain"
  transition={120}
  cachePolicy="none"
  onError={(e) => console.warn("Viewer image error:", e)}
/>
```

**Possible Causes**:
1. Data URI from ViewShot capture might be invalid or too large
2. `ExpoImage` might not support data URIs properly
3. The URI resolution logic might be picking the wrong source

### Issue 3: Editor Image Display

**Location**: `src/app/(app)/photo.tsx`

**Current Status**: 
- Editor uses `ExpoImage` for display
- Has complex URI conversion logic (data URI, encoded file URIs)
- Uses ViewShot for export (correct - only during export)

**Potential Issues**:
- Editor might be receiving data URIs that are too large
- URI conversion logic might be failing silently

## How We Made Editor and Viewer Show Images

### Editor (photo.tsx)

1. **Switched to ExpoImage**: Replaced React Native's `Image` with `expo-image`'s `ExpoImage` for better URI handling
2. **Data URI Support**: Added logic to handle data URIs directly without file system operations
3. **URI Conversion**: Added fallback to convert encoded file URIs to data URIs if needed
4. **Non-blocking Loading**: Set default dimensions immediately and allow image to load without blocking

```typescript
// Editor uses ExpoImage
<ExpoImage
  source={{ uri: baseUri }}
  style={{ flex: 1, width: "100%" }}
  contentFit="contain"
  transition={120}
/>

// URI resolution prioritizes sourceUri
const baseUri = sourceUri || bakedParam || '';
```

### Viewer (viewer.tsx)

1. **ExpoImage Component**: Uses `ExpoImage` for display
2. **URI Resolution**: Prioritizes `shot?.bakedUri` → `shot?.uri` → `params.uri`
3. **Simple Display**: No complex URI conversion, relies on ExpoImage to handle URIs

```typescript
// Viewer uses ExpoImage
<ExpoImage
  source={{ uri: base }}
  style={styles.image}
  contentFit="contain"
  transition={120}
/>

// URI resolution
const base = shot?.bakedUri ?? shot?.uri ?? (typeof params.uri === "string" ? params.uri : undefined);
```

## Root Cause Analysis

### Why Viewer Shows Black Screen

1. **Data URI from ViewShot**: The camera is passing a data URI from `captureRef`, which might be:
   - Too large for `ExpoImage` to handle
   - Malformed or incomplete
   - Not properly encoded

2. **Timing Issues**: The ViewShot capture might be happening before overlays are fully rendered, resulting in a black/empty capture

3. **URI Resolution**: The viewer might be picking the wrong URI source (data URI instead of file URI)

## Recommended Solutions

### Solution 1: Remove ViewShot from Camera Capture

**Action**: Remove the `captureRef` call from `takePhoto` in `camera-advanced.tsx`

**Changes**:
1. Remove `previewShotRef` and `ViewShot` wrapper from camera preview
2. Only use `takePictureAsync` to get the raw photo
3. Pass the raw photo URI to viewer
4. Apply effects in viewer/editor, not during capture

**Code Changes**:
```typescript
// BEFORE (with ViewShot capture)
const takePhoto = useCallback(async () => {
  const pic = await camRef.current.takePictureAsync({ quality: 0.9, skipProcessing: true });
  const captured = await captureRef(previewShotRef, { format: "jpg", quality: 0.92, result: "data-uri" });
  bakedUri = captured; // Screenshot
  router.replace({ pathname: "/(app)/viewer", params: { uri: bakedUri, raw: pic.uri } });
}, []);

// AFTER (no ViewShot capture)
const takePhoto = useCallback(async () => {
  const pic = await camRef.current.takePictureAsync({ quality: 0.9, skipProcessing: true });
  // No screenshot - just pass raw photo
  router.replace({ pathname: "/(app)/viewer", params: { uri: pic.uri } });
}, []);
```

### Solution 2: Fix Viewer URI Resolution

**Action**: Ensure viewer always uses a valid file URI, not a data URI

**Changes**:
1. Prioritize file URIs over data URIs
2. If only data URI is available, convert it to a file first
3. Add better error handling and logging

### Solution 3: Keep ViewShot Only for Export

**Action**: Ensure ViewShot is only used in export functions (viewer export, editor export)

**Current Status**:
- ✅ Editor export uses ViewShot (correct)
- ❌ Camera capture uses ViewShot (incorrect - should be removed)
- ❌ Viewer export might need ViewShot if effects need to be baked

## Implementation Plan

1. **Remove ViewShot from Camera**:
   - Remove `previewShotRef` and `ViewShot` wrapper
   - Simplify `takePhoto` to only use `takePictureAsync`
   - Remove `captureRef` call from capture flow

2. **Fix Viewer Display**:
   - Ensure viewer always receives a valid file URI
   - Add fallback to convert data URIs to files if needed
   - Add error logging to diagnose black screen issues

3. **Keep ViewShot for Export Only**:
   - Editor export: ✅ Already uses ViewShot correctly
   - Viewer export: Add ViewShot if effects need to be baked during export

## Testing Checklist

- [ ] Camera capture no longer takes screenshots
- [ ] Viewer displays images correctly after capture
- [ ] Editor displays images correctly
- [ ] Export from viewer works (with ViewShot if needed)
- [ ] Export from editor works (already using ViewShot)
- [ ] Effects are visible in viewer/editor (applied as overlays, not baked)

## Conclusion

The main issue is that the camera is taking screenshots during capture when it should only take actual photos. Screenshots should only be used during export. By removing ViewShot from the camera capture flow and ensuring the viewer receives valid file URIs, the black screen issue should be resolved.


# Tint Not Appearing in Viewer After Capture - Investigation Report

## Executive Summary

The tint effect is not appearing in the Viewer screen immediately after camera capture, even though the tint is correctly applied during export from the editor. This report documents the root cause analysis, previous working attempts, and recommended solutions.

---

## Problem Statement

**Issue**: When a photo is captured with a tint effect applied, the Viewer screen (shown immediately after capture) displays the raw image without the tint overlay, even though:
- The tint is visible in the camera preview
- The tint is correctly applied when exporting from the editor
- The `bakedUri` is being stored in the camera store

**Expected Behavior**: The Viewer should display the baked image with the tint effect applied, matching what was seen in the camera preview.

**Actual Behavior**: The Viewer displays the raw image without any tint effect.

---

## System Architecture

### Capture Flow

```
Camera Capture → takePhoto()
  ↓
1. Capture raw image (pic.uri)
  ↓
2. setRawUri(pic.uri) → triggers OffscreenComposer re-render
  ↓
3. Wait for composerReadyRef callback (image loaded)
  ↓
4. Wait for overlay rendering (waitForPaint + sleep)
  ↓
5. Capture ViewShot → bakedUri
  ↓
6. pushFallback({ uri: pic.uri, bakedUri, look, tint, alpha })
  ↓
7. Navigate to Viewer with { id: shot.id }
```

### Viewer Flow

```
Viewer receives { id: "..." }
  ↓
1. Lookup shot: camera.recent.find(s => s.id === id)
  ↓
2. Get image URI: shot?.bakedUri ?? shot?.uri
  ↓
3. Display image using ExpoImage
```

---

## Root Cause Analysis

### Issue #1: Race Condition in State Updates

**Location**: `src/app/(app)/camera-advanced.tsx:78-87`

**Problem**: 
```typescript
setRawUri(pic.uri);  // Async state update

let bakedUri = pic.uri;
if (look !== "none" && bakeRef.current) {
  // Immediately waits for callback, but rawUri might not be updated yet
  await new Promise<void>((resolve) => {
    composerReadyRef.current = resolve;
    setTimeout(() => resolve(), 3000);
  });
}
```

**Analysis**: 
- `setRawUri()` triggers a React state update, which is asynchronous
- The `OffscreenComposer` component receives the new `uri` prop, but React may not have re-rendered it yet
- The Promise setup happens immediately, but the `onReady` callback might be called before the component re-renders with the new URI
- If the timeout (3 seconds) fires before the image loads, we proceed with capture anyway, potentially capturing the old image or an empty state

**Evidence**: The `OffscreenComposer` has a `useEffect` that resets `loaded` when `uri` changes, but there's a timing gap between the state update and the component re-render.

### Issue #2: Overlay Rendering Timing

**Location**: `src/components/OffscreenComposer.tsx:26-34`

**Problem**:
```typescript
const handleLoad = () => {
  setLoaded(true);
  // Double RAF to wait for overlay render
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      onReady?.();
    });
  });
};
```

**Analysis**:
- The `onReady` callback is called after the base image loads and two animation frames
- However, the overlay (tint View) is conditionally rendered based on `loaded && look === "tint" && !!alpha && alpha > 0 && tintHex`
- There's a race condition: `onReady` might be called before React has actually painted the overlay View
- The camera capture code waits for `onReady`, then does `waitForPaint()` and `sleep(100)`, but this might not be enough time for the overlay to be fully rendered

**Evidence**: Strong tints require more rendering time, and the current delays might be insufficient.

### Issue #3: ViewShot Capture Failure Handling

**Location**: `src/app/(app)/camera-advanced.tsx:93-101`

**Problem**:
```typescript
let captured: string | undefined;
for (let i = 0; i < 3 && !captured; i++) {
  try {
    const tmp = await captureRef(bakeRef, { format: "jpg", quality: 0.92, result: "tmpfile" });
    if (await fileOk(tmp)) captured = tmp;
    else await sleep(100);
  } catch { await sleep(100); }
}
bakedUri = captured ?? pic.uri;  // Falls back to raw if capture fails
```

**Analysis**:
- If `captureRef` fails or returns an invalid file, we fall back to `pic.uri` (the raw image)
- This means the Viewer will show the raw image without tint
- The retry logic only checks if the file exists and has size > 3000 bytes, but doesn't verify the image actually contains the overlay
- No error logging, so failures are silent

**Evidence**: The fallback mechanism masks the real problem - the capture is failing silently.

### Issue #4: ViewShot Collapsable Optimization

**Location**: `src/components/OffscreenComposer.tsx:37-40`

**Problem**:
```typescript
<View
  style={{ width, height, backgroundColor: "#000" }}
  collapsable={false}
  pointerEvents="none"
>
```

**Analysis**:
- `collapsable={false}` is set on the root View, but ViewShot might still optimize away the overlay
- The overlay Views are absolutely positioned, which might cause ViewShot to not capture them correctly
- ViewShot might be capturing before the overlay is fully painted

**Evidence**: ViewShot has known issues with absolutely positioned overlays, especially when they're conditionally rendered.

### Issue #5: MobX Store Persistence Timing

**Location**: `src/stores/camera-store.ts:77-94`

**Problem**:
```typescript
pushLocal(payload: { uri: string; bakedUri?: string; ... }) {
  const shot: Shot = {
    id,
    uri,
    bakedUri: bakedUri || undefined,  // Only set if truthy
    ...
  };
  this.recent = [shot, ...this.recent].slice(0, 100);
  return shot;
}
```

**Analysis**:
- If `bakedUri` is the same as `uri` (fallback case), it's still stored
- The Viewer uses `shot?.bakedUri ?? shot?.uri`, so if `bakedUri` equals `uri`, it will use `bakedUri` first
- However, if `bakedUri` is undefined or empty, it falls back to `uri`
- The store persistence is async (mobx-persist-store), so there might be a timing issue

**Evidence**: The Viewer correctly prioritizes `bakedUri`, but if it's not set or equals the raw URI, the tint won't appear.

---

## Previous Working Attempts

### Attempt #1: Direct Overlay in Camera Preview (Working for Preview)

**Implementation**: The camera preview shows the tint overlay directly using a View with `backgroundColor: hexToRgba(tint, tintAlpha)`.

**Why It Worked**: 
- The overlay is rendered synchronously in the same render tree as the camera preview
- No async state updates or timing issues
- React Native's rendering pipeline handles it correctly

**Why It Doesn't Work for Capture**:
- The preview overlay is not part of the captured image
- We need to bake the effect into a file, which requires ViewShot

### Attempt #2: Editor Export with ViewShot (Working for Export)

**Implementation**: `src/app/(app)/photo.tsx` uses ViewShot to capture the editor preview with overlay.

**Why It Works**:
- The editor waits for `imgReady` state before allowing export
- Uses `waitForPaint()` and `sleep(150)` to ensure overlay is rendered
- The overlay is part of the same ViewShot component tree
- Longer delays (150ms) give more time for rendering

**Key Differences from Camera**:
1. **State Management**: Editor uses `imgReady` state that's set when the image loads
2. **Longer Delays**: 150ms delay vs 100ms in camera
3. **Synchronous Rendering**: The overlay is always rendered (not conditionally based on async state)
4. **No State Update Race**: The image URI is set via props, not async state

### Attempt #3: OffscreenComposer with onReady Callback (Current - Partially Working)

**Implementation**: Created `OffscreenComposer` component with `onReady` callback to signal when image is loaded.

**Why It Should Work**:
- Separates image loading from overlay rendering
- Uses double `requestAnimationFrame` to wait for overlay paint
- Provides callback mechanism to coordinate with capture

**Why It's Not Working**:
- The callback is called too early (before overlay is painted)
- The state update race condition means the component might not have the new URI when callback is set up
- The timeout (3 seconds) might fire before image loads, causing premature capture
- ViewShot might not capture the overlay correctly due to timing

---

## Recommended Solutions

### Solution #1: Fix State Update Race Condition (High Priority)

**Problem**: `setRawUri()` is async, but we immediately wait for callback.

**Fix**: Use a ref to pass the URI directly, or wait for the component to actually receive the new URI.

```typescript
// Option A: Use ref to bypass state
const rawUriRef = useRef<string | null>(null);

// In takePhoto:
rawUriRef.current = pic.uri;
setRawUri(pic.uri);  // Still update state for UI

// In OffscreenComposer JSX:
<OffscreenComposer
  uri={rawUriRef.current ?? ""}  // Use ref directly
  ...
/>

// Option B: Wait for state to actually update
setRawUri(pic.uri);
await new Promise(r => setTimeout(r, 50));  // Wait for state update
// Then proceed with capture
```

**Priority**: High - This is likely the root cause.

### Solution #2: Increase Overlay Rendering Delays (Medium Priority)

**Problem**: Current delays (100ms) might not be enough for strong tints.

**Fix**: Increase delays and add verification.

```typescript
// After onReady callback:
await waitForPaint();
await sleep(200);  // Increased from 100ms

// Add verification that overlay is rendered
// (e.g., check if ViewShot dimensions match expected)
```

**Priority**: Medium - Helps with strong tints but doesn't fix root cause.

### Solution #3: Add Error Logging and Validation (High Priority)

**Problem**: Failures are silent, making debugging impossible.

**Fix**: Add comprehensive logging and validation.

```typescript
let captured: string | undefined;
for (let i = 0; i < 3 && !captured; i++) {
  try {
    const tmp = await captureRef(bakeRef, { format: "jpg", quality: 0.92, result: "tmpfile" });
    if (await fileOk(tmp)) {
      // Verify file is actually different from raw (has overlay)
      const rawInfo = await FileSystem.getInfoAsync(pic.uri);
      const bakedInfo = await FileSystem.getInfoAsync(tmp);
      if (bakedInfo.size && bakedInfo.size > (rawInfo.size ?? 0) * 0.9) {
        captured = tmp;
        console.log("Baked image captured successfully");
      } else {
        console.warn("Captured image seems invalid, retrying...");
        await sleep(100);
      }
    } else {
      console.warn("Captured file is too small, retrying...");
      await sleep(100);
    }
  } catch (e) {
    console.error("ViewShot capture error:", e);
    await sleep(100);
  }
}
```

**Priority**: High - Essential for debugging and preventing silent failures.

### Solution #4: Force Re-render Before Capture (Medium Priority)

**Problem**: ViewShot might capture stale render.

**Fix**: Force a re-render and wait for it to complete.

```typescript
// Force re-render by updating a dummy state
const [forceRender, setForceRender] = useState(0);
setForceRender(v => v + 1);

// Wait for next render cycle
await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
await sleep(100);
```

**Priority**: Medium - Might help but adds complexity.

### Solution #5: Use Different Capture Strategy (Low Priority - Nuclear Option)

**Problem**: ViewShot might fundamentally not work with this setup.

**Fix**: Use a different approach - render overlay directly in a visible ViewShot, or use native image processing.

**Priority**: Low - Only if other solutions fail.

---

## Testing Plan

### Test Case 1: Basic Tint Capture
1. Set tint to green (#22c55e) with 50% strength
2. Capture photo
3. **Expected**: Viewer shows green-tinted image
4. **Actual**: Viewer shows raw image

### Test Case 2: Strong Tint Capture
1. Set tint to red (#ef4444) with 90% strength
2. Capture photo
3. **Expected**: Viewer shows heavily red-tinted image
4. **Actual**: Viewer shows raw image

### Test Case 3: Night Effect Capture
1. Set look to "night" with 50% strength
2. Capture photo
3. **Expected**: Viewer shows night-vision green image
4. **Actual**: (To be tested)

### Test Case 4: Export from Editor (Baseline)
1. Open photo in editor
2. Apply tint effect
3. Export
4. **Expected**: Exported image has tint
5. **Actual**: ✅ Works (baseline for comparison)

---

## Debugging Steps

1. **Add Logging**: Add `console.log` statements at each step of the capture flow
2. **Verify bakedUri**: Log the `bakedUri` value before storing in MobX
3. **Check File Existence**: Verify the baked file actually exists and has correct size
4. **Compare Files**: Compare raw and baked file sizes (baked should be similar or larger)
5. **Test with Different Tints**: Try different tint colors and strengths
6. **Test Timing**: Add timestamps to measure how long each step takes

---

## Conclusion

The root cause appears to be a **race condition** between React state updates and the ViewShot capture timing. The `setRawUri()` call is asynchronous, but the capture code immediately waits for a callback that might fire before the component has re-rendered with the new URI.

**Recommended Immediate Actions**:
1. Fix the state update race condition (Solution #1)
2. Add comprehensive error logging (Solution #3)
3. Increase overlay rendering delays (Solution #2)
4. Test and verify with different tint strengths

The editor export works because it doesn't have the same state update race condition - the image URI is passed via props and the component is already mounted and ready.

---

## Appendix: Code References

- Camera Capture: `src/app/(app)/camera-advanced.tsx:71-122`
- OffscreenComposer: `src/components/OffscreenComposer.tsx`
- Viewer: `src/app/(app)/viewer.tsx:8-73`
- Editor Export: `src/app/(app)/photo.tsx:198-250`
- Camera Store: `src/stores/camera-store.ts:77-94`


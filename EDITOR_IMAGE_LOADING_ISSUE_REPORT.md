# Editor Image Loading Issue - Investigation Report

## Executive Summary

When pressing "Edit" in the Viewer screen, the editor opens but displays a black screen instead of the image. The editor functionality (applying tints) works correctly, indicating the component is functional but the image is not loading. This report documents the root cause analysis and previous working methods.

---

## Problem Statement

**Issue**: When opening the editor from the Viewer via the "Edit" button, the image does not display - only a black screen is shown.

**Expected Behavior**: The editor should display the same image that was visible in the Viewer.

**Actual Behavior**: The editor shows a black screen, but tint overlays can still be applied (indicating the editor is functional).

**Affected Flow**: Viewer → Edit Button → Editor (black screen)
**Working Flow**: Gallery Pick → Editor (works correctly)

---

## System Architecture

### Viewer to Editor Flow

```
Viewer Screen
  ↓
1. Gets image URI: base = shot?.bakedUri ?? shot?.uri
  ↓
2. handleEdit() pushes route:
   router.push({
     pathname: "/(app)/photo",
     params: { sourceUri: base, effect: "none" }
   })
  ↓
3. Editor receives params.sourceUri
  ↓
4. Editor computes: bakedParam = params.sourceUri
  ↓
5. Editor computes: baseUri = bakedParam || sourceUri
  ↓
6. Editor resolves URI: resolvedUri state
  ↓
7. Editor renders: <ExpoImage source={{ uri: resolvedUri }} />
```

### Key Components

**Viewer (`src/app/(app)/viewer.tsx`)**:
- Uses `ExpoImage` to display image
- Gets URI: `shot?.bakedUri ?? shot?.uri`
- Passes `sourceUri: base` to editor

**Editor (`src/app/(app)/photo.tsx`)**:
- Receives `params.sourceUri` as `bakedParam`
- Computes `baseUri = bakedParam || sourceUri`
- Uses `resolvedUri` state for rendering
- Renders with `ExpoImage`

---

## Root Cause Analysis

### Issue #1: URI Resolution Race Condition

**Location**: `src/app/(app)/photo.tsx:158-187`

**Problem**:
```typescript
const [resolvedUri, setResolvedUri] = React.useState<string>(baseUri || "");

React.useEffect(() => {
  if (!baseUri) {
    setResolvedUri("");
    return;
  }
  // Set immediately so image can start loading
  setResolvedUri(baseUri);
  
  (async () => {
    // Async resolution logic...
  })();
}, [baseUri]);
```

**Analysis**:
- `resolvedUri` is initialized with `baseUri` immediately
- However, if `baseUri` changes (e.g., from empty to a value), the state update is async
- The `useEffect` runs, but the initial state might be empty if `baseUri` is computed after the first render
- The async resolution might overwrite a working URI with a broken one

**Evidence**: The viewer works because it uses `base` directly without resolution logic.

### Issue #2: `ensureFilePath` Breaking Valid URIs

**Location**: `src/app/(app)/photo.tsx:48-58`

**Problem**:
```typescript
const ensureFilePath = async (uri: string): Promise<string> => {
  if (uri.startsWith("file://")) return uri;
  // Copy non-file:// URIs to cache directory
  const filename = uri.split("/").pop() || `img_${Date.now()}.jpg`;
  const destUri = `${FileSystem.cacheDirectory}${filename}`;
  try {
    await FileSystem.copyAsync({ from: uri, to: destUri });
    return destUri;
  } catch {
    return uri; // Fallback to original
  }
};
```

**Analysis**:
- For `file://` URIs, it returns immediately (good)
- For other URIs (like temporary files from ViewShot), it tries to copy
- If the copy fails, it returns the original URI
- However, the copy might succeed but the destination file might not be accessible
- The `fileOk` check might fail on the copied file, causing the editor to not update `resolvedUri`

**Evidence**: Gallery picks work because they use `content://` URIs that `ExpoImage` handles natively.

### Issue #3: `fileOk` Check Too Strict

**Location**: `src/app/(app)/photo.tsx:44-46`

**Problem**:
```typescript
const fileOk = async (uri?: string, min = 3000) => {
  if (!uri) return false;
  try { const i = await FileSystem.getInfoAsync(uri); return !!i.exists && (i.size ?? 0) > min; } catch { return false; }
};
```

**Analysis**:
- Minimum size check of 3000 bytes might be too strict
- Some valid images might be smaller
- `FileSystem.getInfoAsync` might fail on certain URI types (like `content://`)
- The check might incorrectly reject valid URIs

**Evidence**: The viewer doesn't do this check and works fine.

### Issue #4: ExpoImage Not Handling Temporary File URIs

**Location**: `src/app/(app)/photo.tsx:325-337`

**Problem**:
```typescript
<ExpoImage
  source={{ uri: resolvedUri }}
  style={{ width: imgW, height: imgH }}
  contentFit="cover"
  transition={0}
  cachePolicy="none"
  onLoad={onBaseImageLoad}
  onError={(e) => { ... }}
/>
```

**Analysis**:
- `ExpoImage` might not handle temporary file URIs from ViewShot captures
- The `bakedUri` from camera captures is a temporary file path
- These files might be cleaned up or inaccessible by the time the editor loads
- `cachePolicy="none"` might prevent caching, but if the file doesn't exist, it can't load

**Evidence**: Gallery picks work because they use persistent `content://` URIs.

### Issue #5: State Initialization Timing

**Location**: `src/app/(app)/photo.tsx:155-156`

**Problem**:
```typescript
const baseUri = bakedParam || sourceUri;
const [resolvedUri, setResolvedUri] = React.useState<string>(baseUri || "");
```

**Analysis**:
- `baseUri` is computed from `bakedParam` which comes from `params.sourceUri`
- `params` might not be available on first render (Expo Router async)
- `baseUri` might be empty initially, so `resolvedUri` starts as empty string
- Even when `baseUri` updates, the `useEffect` might not trigger correctly

**Evidence**: The viewer works because it uses `useLocalSearchParams` which is reactive.

---

## Previous Working Methods

### Method #1: Direct URI Usage (Viewer - Currently Working)

**Implementation**: Viewer uses `base` directly without resolution:
```typescript
const base = shot?.bakedUri ?? shot?.uri ?? (typeof params.uri === "string" ? params.uri : undefined);
<ExpoImage source={{ uri: base }} ... />
```

**Why It Worked**:
- No async resolution logic
- No file existence checks
- Direct URI pass-through
- `ExpoImage` handles the URI natively

**Why It Doesn't Work in Editor**:
- Editor has complex resolution logic that interferes
- The `resolvedUri` state adds a layer of indirection
- The async `ensureFilePath` might break valid URIs

### Method #2: Gallery Pick Flow (Currently Working)

**Implementation**: Gallery picks pass URI directly:
```typescript
router.push({
  pathname: "/(app)/photo",
  params: {
    sourceUri: firstUri,  // Direct from ImagePicker
    effect: "none",
  },
});
```

**Why It Works**:
- Uses `content://` URIs from ImagePicker
- These URIs are persistent and accessible
- `ExpoImage` handles `content://` URIs natively
- No resolution logic interferes

**Key Difference**: Gallery picks use persistent system URIs, while camera captures use temporary files.

### Method #3: React Native Image Component (Previous Attempt)

**Implementation**: Editor previously used React Native's `Image` component:
```typescript
<Image
  source={{ uri: resolvedUri }}
  style={{ width: imgW, height: imgH, resizeMode: "cover" }}
  onLoad={onBaseImageLoad}
/>
```

**Why It Was Changed**:
- Didn't handle `content://` URIs well on Android
- Had issues with temporary file URIs
- Switched to `ExpoImage` for better URI handling

**Why It Might Have Worked**:
- Simpler - no resolution logic
- Direct URI usage
- Less async state management

### Method #4: Simple URI Pass-Through (Hypothetical - Should Work)

**Implementation**: Use URI directly without resolution:
```typescript
const baseUri = bakedParam || sourceUri;
// No resolvedUri state, no ensureFilePath
<ExpoImage source={{ uri: baseUri }} ... />
```

**Why This Should Work**:
- Matches viewer's approach
- No async resolution that can break
- `ExpoImage` handles URIs natively
- Simpler state management

---

## Recommended Solutions

### Solution #1: Simplify URI Handling (High Priority)

**Approach**: Remove the `resolvedUri` state and `ensureFilePath` logic, use URI directly like the viewer.

**Implementation**:
```typescript
// Remove resolvedUri state
// Remove ensureFilePath logic in useEffect
const baseUri = bakedParam || sourceUri;

// Use directly in ExpoImage
<ExpoImage
  source={{ uri: baseUri }}
  style={{ width: imgW, height: imgH }}
  contentFit="cover"
  ...
/>
```

**Rationale**: The viewer works with this approach. If `ExpoImage` can handle the URI in the viewer, it should handle it in the editor too.

### Solution #2: Fix State Initialization (Medium Priority)

**Approach**: Ensure `resolvedUri` is properly initialized and updated.

**Implementation**:
```typescript
const baseUri = bakedParam || sourceUri;
const [resolvedUri, setResolvedUri] = React.useState<string>("");

React.useEffect(() => {
  if (baseUri) {
    setResolvedUri(baseUri); // Set immediately
  } else {
    setResolvedUri("");
  }
}, [baseUri]);
```

**Rationale**: Ensures state is always in sync with `baseUri`.

### Solution #3: Remove `ensureFilePath` for Viewer URIs (Medium Priority)

**Approach**: Only use `ensureFilePath` for export, not for display.

**Implementation**:
```typescript
// In useEffect, don't call ensureFilePath
// Only use it in doExport() when saving
```

**Rationale**: Display doesn't need file copying - `ExpoImage` can handle URIs directly.

### Solution #4: Add Debug Logging (Low Priority - For Diagnosis)

**Approach**: Add console logs to track URI flow.

**Implementation**:
```typescript
console.log("[EDITOR] baseUri:", baseUri);
console.log("[EDITOR] resolvedUri:", resolvedUri);
console.log("[EDITOR] params:", params);
```

**Rationale**: Helps identify where the URI is getting lost or corrupted.

---

## Testing Plan

### Test Case 1: Viewer → Editor Flow
1. Capture photo with camera
2. View photo in Viewer (should show image)
3. Press "Edit" button
4. **Expected**: Editor shows the image
5. **Actual**: Editor shows black screen

### Test Case 2: Gallery Pick → Editor Flow
1. Pick image from gallery
2. Editor opens automatically
3. **Expected**: Editor shows the image
4. **Actual**: ✅ Works (baseline)

### Test Case 3: Album Long-Press → Editor Flow
1. Long-press photo in Album
2. Editor opens
3. **Expected**: Editor shows the image
4. **Actual**: (To be tested)

### Test Case 4: URI Format Comparison
1. Log URI in Viewer: `console.log("Viewer URI:", base)`
2. Log URI in Editor: `console.log("Editor URI:", baseUri)`
3. Compare formats
4. **Expected**: Same URI format
5. **Actual**: (To be tested)

---

## Debugging Steps

1. **Add Logging**: Add console logs at each step of URI resolution
2. **Verify URI Format**: Check if `bakedUri` is a valid file path
3. **Check File Existence**: Verify the file exists when editor loads
4. **Compare with Viewer**: Log the exact URI used in viewer vs editor
5. **Test Direct URI**: Try passing URI directly without resolution
6. **Check ExpoImage Props**: Verify `ExpoImage` props are correct

---

## Conclusion

The root cause appears to be **over-engineering the URI resolution**. The viewer works because it uses the URI directly without async resolution logic. The editor fails because:

1. The `resolvedUri` state adds unnecessary complexity
2. The `ensureFilePath` logic might be breaking valid URIs
3. The async resolution might be causing timing issues
4. The state initialization might not be syncing correctly

**Recommended Immediate Action**: Simplify the editor to match the viewer's approach - use the URI directly without resolution logic. If `ExpoImage` can handle the URI in the viewer, it should handle it in the editor.

---

## Appendix: Code References

- Viewer: `src/app/(app)/viewer.tsx:15,37-44,57-64`
- Editor URI Resolution: `src/app/(app)/photo.tsx:153-187`
- Editor Image Rendering: `src/app/(app)/photo.tsx:322-337`
- URI Helper: `src/app/(app)/photo.tsx:48-58`
- File Check: `src/app/(app)/photo.tsx:44-46`


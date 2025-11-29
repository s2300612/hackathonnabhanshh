# Tint Baking & Export Issues - Diagnostic Report

## Issues Identified

### Issue 1: Tint Not Being Baked into Captured Images
**Status:** FIXED (but needs verification)

**Root Cause:**
- OffscreenComposer was using `hexToRgba(tintHex, 1)` with `opacity: tintOpacity` style property
- Camera preview uses `hexToRgba(tintHex, tintAlpha)` - bakes alpha directly into rgba
- This mismatch caused ViewShot to capture without the tint overlay properly rendered

**Fix Applied:**
- Changed OffscreenComposer tint overlay to use `hexToRgba(tintHex, tintOpacity)` - matches camera preview approach
- Fixed night overlay to also bake alpha into rgba: `rgba(0,255,128,${nightOpacity})`
- Increased delays: 100ms state update + 250ms overlay rendering before capture
- Added debug logging to track tint parameters

**Files Modified:**
- `src/components/OffscreenComposer.tsx` - Fixed tint/night overlay rendering
- `src/app/(app)/camera-advanced.tsx` - Increased delays and added logging

### Issue 2: Export Stuck on "Exporting..."
**Status:** PARTIALLY FIXED

**Root Cause:**
- `waitEditorReady()` could wait indefinitely if `imgReady` never becomes true
- No timeout protection in export flow
- ViewShot capture might be failing silently

**Fix Applied:**
- Added 3-second hard timeout to `waitEditorReady()`
- Increased overlay rendering delay to 200ms before capture
- Added double RAF before capture
- Added better error logging

**Files Modified:**
- `src/app/(app)/photo.tsx` - Added timeout and better error handling

### Issue 3: URI Not Being Passed to OffscreenComposer
**Status:** NEEDS VERIFICATION

**Potential Issue:**
- OffscreenComposer uses `uri={rawUriRef.current ?? rawUri ?? ""}`
- If both are null initially, component receives empty string
- Component might not re-render when URI is set

**Fix Applied:**
- Added null check in OffscreenComposer to show placeholder if URI is empty
- Added debug logging to track URI passing
- Increased delay before waiting for composer ready (100ms)

**Files Modified:**
- `src/components/OffscreenComposer.tsx` - Added URI validation
- `src/app/(app)/camera-advanced.tsx` - Increased delay before bake

---

## Key Differences Found

### Camera Preview vs OffscreenComposer

**Camera Preview (Working):**
```typescript
backgroundColor: hexToRgba(camera.tint as Hex, camera.tintAlpha)
// Result: rgba(r, g, b, alpha) - alpha baked into color
```

**OffscreenComposer (Was Broken, Now Fixed):**
```typescript
// OLD (broken):
backgroundColor: hexToRgba(tintHex, 1), opacity: tintOpacity
// Result: Full color with opacity style - might not capture correctly

// NEW (fixed):
backgroundColor: hexToRgba(tintHex, tintOpacity)
// Result: rgba(r, g, b, alpha) - alpha baked into color (matches preview)
```

### Editor Preview vs Hidden ViewShot

**Editor Preview (Visible):**
- Uses `hexToRgba(tint as Hex, strength)` - alpha baked into rgba ✅
- Works correctly

**Hidden ViewShot (For Export):**
- Uses same approach as preview ✅
- Should work, but timing might be off

---

## Remaining Issues to Check

### 1. URI Timing
- When photo is taken, `rawUriRef.current` is set immediately
- But `rawUri` state update might be delayed
- OffscreenComposer might receive empty URI initially

**Check:** Console logs should show if URI is empty when OffscreenComposer mounts

### 2. Image Loading in OffscreenComposer
- Uses React Native `Image` component (not `ExpoImage`)
- May have URI compatibility issues with `file://` URIs from camera
- `onLoad` callback might not fire if image fails to load

**Check:** Console logs should show "[OffscreenComposer] Image loaded" or error

### 3. Overlay Rendering Timing
- Even with increased delays, overlays might not be painted when ViewShot captures
- React Native might batch renders, causing delay

**Check:** Console logs should show tint parameters before capture

### 4. Export Timeout
- 3-second timeout might be too short for slow devices
- If capture takes longer, export will fail

**Check:** Console logs should show "[EDITOR] waitEditorReady timeout" if timing out

---

## Debugging Steps

1. **Check Console Logs:**
   - `[CAMERA] Starting bake` - Should show look, alpha, tint, uri
   - `[OffscreenComposer] Image loaded` - Should show URI
   - `[OffscreenComposer] Tint overlay` - Should show tint config
   - `[OffscreenComposer] Calling onReady` - Should show tintOpacity > 0
   - `[CAMERA] Capturing baked image` - Should happen after delays
   - `[CAMERA] Baked image persisted to` - Should show permanent URI

2. **Check Export Logs:**
   - `[EDITOR] Capturing export` - Should show look and strength
   - `[EDITOR] Capture successful` - Should appear after capture
   - `[EDITOR] waitEditorReady timeout` - Indicates timing issue

3. **Verify File Existence:**
   - Check if baked files exist in cache directory
   - Check file sizes (should be > 3000 bytes)

---

## Recommended Next Steps

1. **Test with Console Open:**
   - Take photo with tint
   - Check all console logs
   - Verify URI is passed correctly
   - Verify tint overlay is rendered

2. **If Tint Still Not Baking:**
   - Check if `tintOpacity` is > 0 in logs
   - Check if `tintHex` is valid
   - Verify image is loading in OffscreenComposer
   - Try increasing delays further (300ms, 400ms)

3. **If Export Still Hanging:**
   - Check if `waitEditorReady` is timing out
   - Check if ViewShot capture is succeeding
   - Verify file path is valid
   - Check MediaLibrary permissions

4. **Alternative Approach:**
   - Consider using `ExpoImage` in OffscreenComposer instead of React Native `Image`
   - Consider using a different capture method (e.g., canvas-based)
   - Consider pre-rendering the baked image before navigation

---

## Files Modified Summary

1. **`src/components/OffscreenComposer.tsx`**
   - Fixed tint overlay to bake alpha into rgba (matches camera preview)
   - Fixed night overlay to bake alpha into rgba
   - Added URI validation and error handling
   - Added debug logging
   - Increased onReady delay to 150ms

2. **`src/app/(app)/camera-advanced.tsx`**
   - Increased delays before capture (100ms + 250ms)
   - Added debug logging
   - Improved error handling

3. **`src/app/(app)/photo.tsx`**
   - Added 3-second timeout to `waitEditorReady()`
   - Increased overlay rendering delay to 200ms
   - Added debug logging
   - Improved error handling

---

**Report Generated:** $(date)
**Status:** Fixes Applied - Awaiting User Verification


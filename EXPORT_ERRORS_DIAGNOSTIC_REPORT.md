# Export Errors Diagnostic Report

## Date: Current Session
## Issues Identified: 2 Critical Errors

---

## Error 1: MediaLibrary.saveToLibraryAsync Data URI Extension Issue

### Error Message:
```
[Error: Call to function 'ExpoMediaLibrary.saveToLibraryAsync' has been rejected.
→ Caused by: Could not get the file's extension.]
```

### Root Cause:
- `MediaLibrary.saveToLibraryAsync()` expects a file URI with a proper file extension (e.g., `.jpg`, `.png`)
- Data URIs (`data:image/jpeg;base64,...`) don't have file extensions
- The MediaLibrary API cannot infer the file type from the data URI MIME type alone

### Current Code Flow:
1. ViewShot captures as data URI: `data:image/jpeg;base64,...`
2. Code tries `MediaLibrary.saveToLibraryAsync(dataUri)` directly
3. **FAILS** because no file extension
4. Falls back to file conversion (which then fails due to directory issues)

### Solution:
- **Remove direct data URI save attempt** - it will always fail
- Always convert data URI to a temporary file first
- Use the Camera directory (known writable location) for temp files
- Then pass the file URI to `MediaLibrary.createAssetAsync()` or `saveToLibraryAsync()`

---

## Error 2: ViewShot Capture Timeout

### Error Message:
```
[EDITOR] ViewShot capture timeout after 10 seconds
```

### Root Cause Analysis:

#### Possible Causes:
1. **Image/Overlay Not Fully Rendered**
   - ViewShot tries to capture before overlays are painted
   - `waitEditorReady()` might resolve too early
   - Race condition between image load and overlay render

2. **Large Image Size**
   - High-resolution images take longer to capture
   - ViewShot processing time increases with image dimensions
   - Quality setting (0.92) might be too high for large images

3. **ViewShot Ref Not Ready**
   - `viewShotRef.current` might be null or not mounted
   - Component might not be fully rendered when capture is called

4. **Memory/Performance Issues**
   - Device might be low on memory
   - Multiple overlays (night/thermal/tint) might slow rendering
   - Complex gradient calculations for thermal effect

### Current Code Flow:
1. `waitEditorReady()` waits for image load
2. 200ms delay + double `requestAnimationFrame`
3. ViewShot capture called
4. **TIMEOUT** after 10 seconds

### Solutions:

#### Solution A: Increase Timeout (Quick Fix)
- Increase timeout from 10s to 15-20s for large images
- Add progress updates during capture

#### Solution B: Verify ViewShot Readiness (Better)
- Check `viewShotRef.current` exists before capture
- Add additional delay after `waitEditorReady()` to ensure overlays render
- Use `InteractionManager.runAfterInteractions()` to wait for all animations

#### Solution C: Reduce Image Quality/Size (Performance)
- Lower quality from 0.92 to 0.85 for faster processing
- Resize image before capture if dimensions are too large
- Use PNG format instead of JPG (might be faster for some devices)

#### Solution D: Capture Strategy Change (Most Robust)
- Capture base image first (no effects)
- Apply effects in post-processing using image manipulation library
- Or: Use multiple smaller captures and composite

---

## Recommended Fix Priority:

### Priority 1: Fix Data URI Issue (Critical)
- Remove direct `saveToLibraryAsync(dataUri)` call
- Always convert to file first
- Use Camera directory for temp files

### Priority 2: Fix ViewShot Timeout (High)
- Increase timeout to 15s
- Add ViewShot readiness check
- Add more delay after `waitEditorReady()`
- Consider reducing quality if still timing out

### Priority 3: Improve Error Messages (Medium)
- Show specific error messages to user
- Log detailed diagnostics for debugging
- Add retry mechanism for transient failures

---

## Implementation Plan:

1. **Remove Data URI Direct Save**
   ```typescript
   // REMOVE: await MediaLibrary.saveToLibraryAsync(dataUri);
   // ALWAYS convert to file first
   ```

2. **Enhance ViewShot Capture**
   ```typescript
   // Add readiness check
   if (!viewShotRef.current) throw new Error("ViewShot not ready");
   
   // Increase timeout
   const timeoutPromise = new Promise<null>((resolve) => {
     setTimeout(() => resolve(null), 15000); // 15s instead of 10s
   });
   
   // Add extra delay before capture
   await new Promise(r => setTimeout(r, 300)); // 300ms delay
   ```

3. **Use Camera Directory for Temp Files**
   ```typescript
   // Extract Camera directory from sourceUri or use known pattern
   const cameraDir = extractCameraDirectory(sourceUri) || knownCameraPath;
   ```

---

## Testing Checklist:

- [ ] Export with no effects (base image)
- [ ] Export with tint effect
- [ ] Export with night effect
- [ ] Export with thermal effect
- [ ] Export large images (>5MB)
- [ ] Export small images (<1MB)
- [ ] Export from viewer (baked image)
- [ ] Export from editor (new effects)
- [ ] Verify progress percentage updates correctly
- [ ] Verify timeout doesn't occur
- [ ] Verify file saves to gallery successfully

---

## Known Limitations:

1. **Expo Go File System Restrictions**
   - Some directories are not writable
   - Camera directory is the most reliable location
   - May need to use different paths on different devices

2. **ViewShot Performance**
   - Large images take longer to process
   - Complex overlays increase capture time
   - Device performance varies significantly

3. **MediaLibrary API**
   - Requires file URIs with extensions
   - Data URIs are not directly supported
   - Must convert to file before saving

---

## Next Steps:

1. Implement fixes for both errors
2. Test on physical device (Expo Go)
3. Monitor logs for any new issues
4. Consider adding retry logic for transient failures
5. Add user-friendly error messages


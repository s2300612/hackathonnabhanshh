# Export Diagnostics Report

This report summarizes MediaLibrary export diagnostics for **Camera+**.

Because this instance was generated directly by the assistant (without running on your physical device), it is a **synthetic baseline**. It reflects the current code and design, not live permission/FS state. You can later replace this with a real run by:

1. Running the **Export Diagnostics (DEV)** screen in the app.
2. Copying the `"[EXPORT_DIAG_JSON]"` blob into `docs/export_diag_last.json`.
3. Running `node scripts/write-export-report.mjs`.

---

## Device / App Info

- **OS**: unknown
- **OS Version**: unknown
- **App Version**: unknown
- **Expo SDK**: unknown
- **Last Run At**: UNKNOWN (synthetic run from assistant, not device)

---

## Checklist

- **Permissions (addOnly / write-only) granted?**: WARN  
  Synthetic – depends on user granting Photos/Media permission at runtime.
- **Initial permission state recorded?**: WARN  
  Synthetic – run diagnostics on device to capture real `getPermissionsAsync()` output.
- **Album read APIs avoided during export?**: PASS  
  - `getAlbumAsync` called during diagnostics? NO  
  - `addAssetsToAlbumAsync` called during diagnostics? NO  
  Export flow only uses `requestPermissionsAsync(true)` and `createAssetAsync(fileUri)`.  
  Album read APIs are used only in `album.tsx` to show the gallery, not during export.
- **Dummy 1×1 PNG asset saved successfully?**: WARN  
  Not executed in this synthetic run; needs a real device run to confirm `createAssetAsync` works.
- **Export code uses `file://` URIs (after `ensureFileUri`)?**: SEE EXPORT LOGS  
  The current implementation ensures camera/editor exports pass `file://` URIs, but actual URIs should be verified in Metro logs per-device.
- **Any errors recorded?**: WARN  
  Historical issues around Expo Go file-system restrictions are documented separately; see notes below.

---

## Latest Results (from `export_diag_last.json`)

```json
{
  "runAt": "UNKNOWN (synthetic run from assistant, not device)",
  "device": {
    "os": "unknown",
    "osVersion": "unknown",
    "appVersion": "unknown",
    "expoConfig": {
      "sdkVersion": "unknown",
      "name": "Camera+"
    }
  },
  "permissionInitial": {
    "note": "Real permission snapshot not captured. Run diagnostics on-device to populate."
  },
  "permissionAddOnly": {
    "note": "Real addOnly/write-only permission not captured. Run diagnostics on-device to populate."
  },
  "dummyWrite": {
    "note": "Dummy 1x1 PNG write/createAssetAsync has not been executed in this synthetic run."
  },
  "albumReadCalls": {
    "getAlbumAsyncCalled": false,
    "addAssetsToAlbumAsyncCalled": false,
    "note": "Export path does not call album read APIs by design; Album screen does for gallery view."
  },
  "items": [
    {
      "id": "perm-initial",
      "label": "Initial MediaLibrary permissions",
      "status": "WARN",
      "detail": "Synthetic report – run diagnostics on device for actual permission state."
    },
    {
      "id": "perm-addonly",
      "label": "Request addOnly / write-only permission",
      "status": "WARN",
      "detail": "Synthetic report – real result depends on user granting Photos/Media permission."
    },
    {
      "id": "dummy-asset",
      "label": "Create dummy 1x1 PNG asset",
      "status": "WARN",
      "detail": "Not executed in this synthetic run. Use the Export Diagnostics screen to test."
    },
    {
      "id": "album-read",
      "label": "Album read APIs called during diagnostics",
      "status": "PASS",
      "detail": "Export flow does not invoke getAlbumAsync/addAssetsToAlbumAsync; only Album screen does."
    }
  ],
  "recommendation": "Run the in-app Export Diagnostics screen in a DEV build to capture real device permissions and dummy asset behavior, then regenerate this report with `node scripts/write-export-report.mjs`."
}
```

### Notes

- **Recommendation**: Run the in-app Export Diagnostics screen in a DEV build to capture real device permissions and dummy asset behavior, then regenerate this report with `node scripts/write-export-report.mjs`.

- **Initial permissions JSON**:

```json
{
  "note": "Real permission snapshot not captured. Run diagnostics on-device to populate."
}
```

- **Add-only permissions JSON**:

```json
{
  "note": "Real addOnly/write-only permission not captured. Run diagnostics on-device to populate."
}
```

- **Album read calls JSON**:

```json
{
  "getAlbumAsyncCalled": false,
  "addAssetsToAlbumAsyncCalled": false,
  "note": "Export path does not call album read APIs by design; Album screen does for gallery view."
}
```

- **Dummy write JSON**:

```json
{
  "note": "Dummy 1x1 PNG write/createAssetAsync has not been executed in this synthetic run."
}
```

---

## How to Re-run Diagnostics on Device

1. In a **DEV build**, open **Settings → Export Diagnostics (DEV)**.
2. Tap **Run Diagnostics**.  
   - This will:
     - Snapshot initial and addOnly permissions.
     - Attempt a 1×1 PNG dummy asset save via `createAssetAsync`.
     - Track any album read API calls during the run.
     - Log `"[EXPORT_DIAG_JSON]"` to Metro with the full JSON payload.
3. Copy that JSON from Metro into `docs/export_diag_last.json`.
4. From the project root, run:

```bash
node scripts/write-export-report.mjs
```

5. Open `docs/EXPORT_DIAGNOSTIC_REPORT.md` to review the updated, device-specific report.

---

## Export Path Summary (Code-Level)

- **Permissions**:
  - Uses `MediaLibrary.requestPermissionsAsync(true)` for Android (write-only).
  - On iOS, the diagnostics screen uses `{ accessPrivileges: 'addOnly' }` for write-only.
- **URIs**:
  - Camera capture uses `takePictureAsync` and stores a `file://` URI.
  - Editor export captures a visible `ViewShot` preview, then:
    - Gets a data URI.
    - Converts it to a file in `cacheDirectory`/`documentDirectory`.
    - Calls `MediaLibrary.createAssetAsync(fileUri)`.
  - The helper `ensureFileUri(uri)` in `src/lib/ensureFileUri.ts` guarantees `file://` URIs where used.
- **Album reads**:
  - Only the Album screen (`album.tsx`) uses `getAlbumAsync/getAssetsAsync` to show the gallery.
  - Export flow does **not** use album reads; this is intentional for add-only permission compatibility.



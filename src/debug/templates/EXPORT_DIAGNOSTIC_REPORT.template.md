# Export Diagnostics Report

This report summarizes MediaLibrary export diagnostics for **Camera+**.

## Device / App Info

- **OS**: {{OS}}
- **OS Version**: {{OS_VERSION}}
- **App Version**: {{APP_VERSION}}
- **Expo SDK**: {{SDK_VERSION}}
- **Last Run At**: {{RUN_AT}}

---

## Checklist

- **Permissions (addOnly / write-only) granted?**: {{PERM_ADDONLY_STATUS}}
- **Initial permission state recorded?**: {{PERM_INITIAL_STATUS}}
- **Album read APIs avoided during export?**: {{ALBUM_READ_STATUS}}
  - `getAlbumAsync` called during diagnostics? {{ALBUM_GET_CALLED}}
  - `addAssetsToAlbumAsync` called during diagnostics? {{ALBUM_ADD_CALLED}}
- **Dummy 1×1 PNG asset saved successfully?**: {{DUMMY_ASSET_STATUS}}
- **Export code uses `file://` URIs (after `ensureFileUri`)?**: {{FILE_URI_STATUS}}
- **Any errors recorded?**: {{ERRORS_STATUS}}

---

## Latest Results (from `export_diag_last.json`)

```json
{{LATEST_RESULTS_JSON}}
```

### Notes

- **Recommendation**: {{RECOMMENDATION}}
- **Initial permissions JSON**:

```json
{{PERM_INITIAL_JSON}}
```

- **Add-only permissions JSON**:

```json
{{PERM_ADDONLY_JSON}}
```

- **Album read calls JSON**:

```json
{{ALBUM_READ_JSON}}
```

- **Dummy write JSON**:

```json
{{DUMMY_WRITE_JSON}}
```

---

## How to Re-run Diagnostics

1. In a **DEV** build, open **Settings → Export Diagnostics (DEV)**.
2. Tap **Run Diagnostics**.
3. In Metro logs, copy the line starting with `"[EXPORT_DIAG_JSON]"` into a local file named:

   - `docs/export_diag_last.json`

4. From the project root, run:

```bash
node scripts/write-export-report.mjs
```

5. Open `docs/EXPORT_DIAGNOSTIC_REPORT.md` to review the updated report.



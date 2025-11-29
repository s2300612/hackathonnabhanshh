# Camera+

Camera+ is a coursework-ready Expo Router app that demonstrates real-time camera effects, photo history, and local authentication.
It bakes the active look into each capture so Album, History, and Viewer stay in sync even when Android/Expo Go limits read access.
Everything runs locally, making it simple to demo on-device without cloud services.

## Prerequisites
- Node.js 18+
- Yarn 1.22+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator/Xcode or Android Studio (optional but recommended)

## Quick install & run
```bash
yarn install
expo login   # optional if pushing builds
yarn start   # launches Expo CLI; press i / a / w for targets
```

## Camera+ features
- Real-time effects (None/Night/Thermal/Tint) with baked output
- Local authentication with AsyncStorage-backed session persistence
- Album merges device gallery items with local-only captures (tap → Viewer; long-press → Photo Editor)
- History tracks drafts/exported items with resume, re-edit, and clear actions
- Settings screen centralizes camera defaults plus sign-out

## Feature Walkthrough
1. **Settings persist**: Adjust default look, tint color, and effect strengths in Settings; changes auto-save and show "Saved ✓" feedback. Defaults hydrate on app start and apply to Camera+.
2. **Capture baked effect**: Select a look (None/Night/Thermal/Tint) in Camera+, capture a photo; the effect is baked into the image and opens in Viewer.
3. **Album tap vs long-press**: Tap a photo in Album → opens Viewer; long-press → opens Photo Editor for manual edits.
4. **Viewer export**: From Viewer, tap Export to save to device gallery; export uses MediaLibrary.createAssetAsync() and organizes into album if read permission is granted.
5. **History filter/sort**: Use horizontal filter chips (All/Drafts/Exported) and sort toggle (Newest/Oldest) to manage edit history; resume drafts or re-edit exported items.

## Known limitations (Expo Go)
- Android/Expo Go can deny album read permission; Camera+ falls back to local shots and documents the behavior under Permissions Handling.

## Documentation
See `CameraPlus_User_Guide.docx` for full instructions.

## Submission Documents
- **Application Report**: `APPLICATION_REPORT.md`
- **User Guide (Install & Use)**: `CameraPlus_User_Guide.docx`
- **Technical Documentation**: `CameraPlus_Technical_Documentation_27_Nov_5_41.docx`
- **User Testing Report**: `CameraPlus_UserTesting_Report_27_Nov_5_41.docx` — contains a rubric-style **Summary Evaluation** table covering testing design, execution evidence, analysis/findings, reflection, and writing quality.

# Smoke Test Checklist - Pre-Submission Verification

This document provides a step-by-step checklist to verify all critical functionality before submission.

## ✅ Code Verification (Already Complete)

### Route Protection
- ✅ `(app)/_layout.tsx` waits for `authStore.hydrated` before checking `signedIn`
- ✅ Shows loading spinner during hydration
- ✅ Redirects to `/login` when not signed in

### Media Permission Guards
- ✅ `album.tsx` - `getAlbumAsync()` only called when `canRead === true`
- ✅ `photo.tsx` - `getAlbumAsync()` and `addAssetsToAlbumAsync()` only called when `canRead === true`
- ✅ Export always calls `createAssetAsync()` (write permission)
- ✅ No audio permission requests in MediaLibrary calls

### Auth Store
- ✅ `hydrated` flag tracks initialization
- ✅ Session validation on restore
- ✅ Invalid sessions auto-cleared
- ✅ `clearError()` method for proper error handling

### History Features
- ✅ Long-press delete implemented (`onLongPress={() => handleDelete(item.id)}`)
- ✅ Clear history button works
- ✅ Resume restores draft settings
- ✅ Re-edit creates new draft (no `editId` in params)

### Settings & Details
- ✅ Single Settings screen with Camera + Account sections
- ✅ Sign out redirects to login
- ✅ Details page has "Known Expo Go Limitations" section

## 🧪 Device Testing Checklist

Run these tests on a physical device or emulator:

### 1. Cold Start Gatekeeping

**Test 1.1: Signed Out State**-Needs Video
- [✅] Kill app completely (swipe away from recent apps)
- [✅] Relaunch app
- [✅] **Expected:** Login screen appears
- [✅] **If fails:** Check `authStore.hydrated` and `authStore.signedIn` in `(app)/_layout.tsx`

**Test 1.2: Login Flow**-Needs Video
- [✅] Enter registered email and password
- [✅] Tap "Login"
- [✅] **Expected:** Lands on Camera+ tab (not Album or History)
- [✅] **If fails:** Check navigation in `login.tsx` - should use `router.replace("/(app)/camera-advanced")`

**Test 1.3: Session Persistence**-Needs Video
- [✅] After successful login, kill app completely
- [✅] Relaunch app
- [✅] **Expected:** Still lands on Camera+ (session restored)
- [✅] **If fails:** Check `authStore.init()` in `auth-store.tsx` - should restore session from AsyncStorage

### 2. Registration & Validation

**Test 2.1: New Registration**-Needs Video
- [✅] Go to Register screen
- [✅] Enter unused email (e.g., `test@example.com`)
- [✅] Enter password (6+ characters)
- [✅] Tap "Register"
- [✅] **Expected:** Auto-logs in and lands on Camera+
- [✅] **If fails:** Check `auth.register()` - should set `signedIn = true` and save session

**Test 2.2: Duplicate Email**
- [✅] Try to register with existing email
- [✅] **Expected:** Shows "Email already registered" error
- [✅] **If fails:** Check `auth.register()` - should check users map before creating

**Test 2.3: Email Validation**
- [✅] Enter invalid email (e.g., `notanemail`)
- [✅] **Expected:** Button disabled, or inline error message
- [✅] **If fails:** Check `auth.isValidEmail()` and validation in `register.tsx`

**Test 2.4: Password Validation**
- [✅] Enter password with < 6 characters
- [✅] **Expected:** Red text under input: "Password must be at least 6 characters"
- [✅] **If fails:** Check `register.tsx` - should show validation message

**Test 2.5: Error Clearing**-Needs Video
- [✅] Trigger an error (wrong password, duplicate email)
- [✅] Start typing in email or password field
- [✅] **Expected:** Error message disappears
- [✅] **If fails:** Check `handleEmailChange` and `handlePasswordChange` - should call `auth.clearError()`

### 3. Permissions

**Test 3.1: First Run Permissions**
- [✅] Fresh install or clear app data
- [✅] Launch app and login
- [✅] **Expected:** Camera permission prompt appears
- [✅] **Expected:** Media/Photos permission prompt appears (write-only on Android)
- [✅] **If fails:** Check if permissions are requested in `_layout.tsx` or on first camera/album access

**Test 3.2: Album Without Read Permission**
- [ ] Deny read permission (or use Android/Expo Go where read is limited)
- [ ] Navigate to Album tab
- [ ] **Expected:** Shows fallback grid with local images
- [ ] **Expected:** Shows "Pick from Gallery" button
- [ ] **Expected:** NO "Grant permission" button that could trigger AUDIO error
- [ ] **Expected:** NO crash
- [ ] **If fails:** Check `album.tsx` - should check `canRead` before calling `getAlbumAsync()`

**Test 3.3: Export Without Read Permission**
- [ ] With read permission denied
- [ ] Go to Camera+ or Album
- [ ] Capture/pick a photo
- [ ] Apply effect and Export
- [ ] **Expected:** Success toast appears
- [ ] **Expected:** Photo saved to gallery (check device gallery)
- [ ] **Expected:** NO crash
- [ ] **If fails:** Check `photo.tsx` - should only call `createAssetAsync()` if `canWrite === true`, skip album management if `canRead === false`

### 4. Editor & Export

**Test 4.1: Photo Editing**-Needs Video
- [✅] Pick photo from gallery or capture new
- [✅] Apply "night" effect
- [✅] Adjust strength slider
- [✅] **Expected:** Preview updates in real-time
- [✅] **If fails:** Check overlay rendering in `photo.tsx`

**Test 4.2: Export Flow**-Needs Video
- [✅] After editing, tap "Export"
- [✅] **Expected:** Button shows "Exporting…" (disabled)
- [X] **Expected:** After completion, shows success toast
- [✅] **Expected:** Button returns to "Export" (not stuck on "Exporting…")
- [✅] **Expected:** Navigates back to Album
- [✅] **If fails:** Check `onExport()` in `photo.tsx` - `finally` block must call `setExporting(false)`

**Test 4.3: Export History Entry**-Needs Video
- [✅] After export, go to History tab
- [✅] **Expected:** Entry appears with "Exported" badge (green)
- [✅] **Expected:** Shows exported image thumbnail
- [✅] **If fails:** Check `history.markExported()` is called in `photo.tsx`

**Test 4.4: Export Error Handling**
- [ ] Deny write permission (if possible)
- [ ] Try to export
- [ ] **Expected:** Error toast + alert appear
- [ ] **Expected:** Button returns to "Export" (not stuck)
- [ ] **If fails:** Check error handling in `onExport()` - should catch and show message

### 5. History UX

**Test 5.1: Filter Chips**
- [✅] Go to History tab
- [✅] **Expected:** Filter chips (All, Drafts, Exported) scroll horizontally
- [✅] **Expected:** "Oldest/Newest" toggle on right doesn't overlap chips
- [✅] **If fails:** Check `history.tsx` - chips should be in horizontal `ScrollView`

**Test 5.2: Drafts Filter**
- [✅] Create a draft (pick photo, don't export)
- [✅] Go to History
- [✅] Tap "Drafts" filter
- [✅] **Expected:** Only shows draft entries
- [✅] **If fails:** Check `history.filteredSortedEdits` computed property

**Test 5.3: Resume Draft**
- [✅] Tap "Resume" on a draft entry
- [✅] **Expected:** Opens editor with previous effect/strength/color
- [✅] **Expected:** Can continue editing
- [✅] **If fails:** Check `handleResume()` - should pass `editId` and all settings

**Test 5.4: Re-edit Exported**-Needs Video
- [✅] Tap "Re-edit" on an exported entry
- [✅] **Expected:** Opens editor with same settings
- [✅] **Expected:** Creates NEW draft entry (check History - should have 2 entries)
- [✅] **If fails:** Check `handleReEdit()` - should NOT pass `editId`, so new draft is created

**Test 5.5: Long-Press Delete**
- [✅] Long-press any history entry
- [✅] **Expected:** Alert appears: "Delete - Remove this history entry?"
- [✅] Tap "Delete"
- [✅] **Expected:** Entry removed from list
- [✅] **If fails:** Check `onLongPress` handler in `history.tsx`

**Test 5.6: Clear History**-Needs Video
- [✅] Scroll to bottom of History
- [✅] Tap "Clear history" button
- [✅] **Expected:** Alert appears: "Clear history - Remove all edited photos from history?"
- [✅] Tap "Clear"
- [✅] **Expected:** All entries removed, shows empty state
- [✅] **If fails:** Check `clear()` function in `history.tsx`

### 6. Settings & Details

**Test 6.1: Settings Screen**
- [✅] Go to Settings tab
- [✅] **Expected:** Shows "Camera Settings" section (default look, tint, strengths)
- [✅] **Expected:** Shows "Account" section below (signed-in status, Sign out button)
- [✅] **Expected:** NO duplicate "Style" or "Account" pages
- [✅] **If fails:** Check `settings.tsx` - should have both sections in one screen

**Test 6.2: Sign Out**-Needs Video
- [✅] In Settings, tap "Sign out"
- [✅] **Expected:** Redirects to Login screen
- [✅] **Expected:** Next navigation attempt shows Login (not Camera+)
- [✅] **If fails:** Check `handleSignOut()` - should call `auth.logout()` and `router.replace("/login")`

**Test 6.3: Details Screen**
- [✅] Go to Details tab
- [✅] Scroll down
- [✅] **Expected:** Shows "Known Expo Go Limitations" section with yellow background
- [✅] **Expected:** Explains Android/Expo Go read permission limitations
- [✅] **If fails:** Check `details.tsx` - should have limitations section

## 🚨 Common Issues & Fixes

### Issue: App crashes on Album tab
**Fix:** Ensure `getAlbumAsync()` is NEVER called when `canRead === false`. Check `album.tsx` line 33.

### Issue: Export button stuck on "Exporting…"
**Fix:** Ensure `finally` block in `onExport()` always calls `setExporting(false)`. Check `photo.tsx` line 272.

### Issue: App shows wrong screen on launch
**Fix:** Ensure `(app)/_layout.tsx` waits for `authStore.hydrated` before checking `signedIn`. Check line 10-12.

### Issue: History filter chips overlap
**Fix:** Ensure chips are in horizontal `ScrollView` with proper spacing. Check `history.tsx` line 83-111.

### Issue: Password validation doesn't show
**Fix:** Ensure validation message appears when `password.length > 0 && password.length < 6`. Check `register.tsx` line 66-70.

## ✅ Final Verification

Before submission, ensure:
- [ ] All tests above pass on device
- [ ] No crashes during normal usage
- [ ] No console errors in Metro bundler
- [ ] All screenshots captured (Login, Register, Camera+, Album, Editor, History, Settings, Details)
- [ ] Demo video recorded (2-3 minutes)
- [ ] README updated with test account or "register any email" note
- [ ] APPLICATION_REPORT.md included
- [ ] SUBMISSION_FIXES.md included (this document)

## 📝 Submission Package Checklist

- [ ] **Code:** Complete project folder or Expo project
- [ ] **README.md:** Quick start, limitations note, test instructions
- [ ] **APPLICATION_REPORT.md:** Full architecture documentation
- [ ] **SUBMISSION_FIXES.md:** Summary of fixes applied
- [ ] **SMOKE_TEST_CHECKLIST.md:** This document
- [ ] **Screenshots:** All major screens (8-10 images)
- [ ] **Demo Video:** 2-3 minute walkthrough (MP4 or link)

---

**Status:** Ready for device testing. Run the checklist above and mark items as you verify them.


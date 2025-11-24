# Application Report: Expo Go Villa Sample - Photo Editing Camera App

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Application Overview](#application-overview)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Core Features](#core-features)
7. [State Management](#state-management)
8. [Authentication System](#authentication-system)
9. [Navigation Structure](#navigation-structure)
10. [Screen Details](#screen-details)
11. [Photo Editing Workflow](#photo-editing-workflow)
12. [History System](#history-system)
13. [Permissions Handling](#permissions-handling)
14. [Data Persistence](#data-persistence)
15. [UI/UX Design](#uiux-design)
16. [Development Setup](#development-setup)
17. [Known Limitations](#known-limitations)
18. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**Application Name:** Expo Go Villa Sample  
**Version:** 1.0.0  
**Platform:** iOS & Android (via Expo Go)  
**Framework:** React Native with Expo SDK 54  
**Primary Purpose:** A photo editing camera application with real-time effects, history tracking, and local authentication.

This application provides users with a comprehensive photo editing experience, allowing them to:
- Capture photos with real-time visual effects (night vision, thermal, tint overlays)
- Edit photos with customizable effect strengths
- Track editing history with draft and exported states
- Manage a personal album of edited photos
- Secure access through local authentication

---

## Application Overview

### Purpose
A mobile photo editing application designed for coursework that demonstrates:
- React Native and Expo development
- State management with MobX
- Local authentication and data persistence
- Camera and media library integration
- Real-time image processing and effects
- History tracking and management

### Target Users
- Photography enthusiasts
- Users seeking quick photo editing tools
- Educational purposes (coursework demonstration)

### Key Value Propositions
1. **Real-time Effects:** Apply visual effects while capturing photos
2. **Edit History:** Track all edits with resume and re-edit capabilities
3. **Local Storage:** All data stored locally for privacy
4. **Simple Authentication:** Email/password-based local authentication
5. **Cross-platform:** Works on both iOS and Android via Expo Go

---

## Technology Stack

### Core Framework
- **React Native:** 0.81.5
- **React:** 19.1.0
- **Expo SDK:** ~54.0.20
- **Expo Router:** ~6.0.10 (File-based routing)

### State Management
- **MobX:** ^6.15.0 (Reactive state management)
- **mobx-react-lite:** ^4.1.1 (React bindings)
- **mobx-persist-store:** ^1.1.8 (AsyncStorage persistence)

### Storage
- **@react-native-async-storage/async-storage:** ^2.2.0 (Local data persistence)

### Camera & Media
- **expo-camera:** ~17.0.9 (Camera access)
- **expo-media-library:** ~18.2.0 (Photo library access)
- **expo-image-picker:** ~17.0.8 (Gallery image selection)
- **react-native-view-shot:** 4.0.3 (Screenshot capture for exports)

### UI Components
- **@expo/vector-icons:** ^15.0.3 (Ionicons)
- **@react-native-community/slider:** 5.0.1 (Range sliders)
- **react-native-safe-area-context:** ~5.6.0 (Safe area handling)
- **react-native-gesture-handler:** ~2.28.0 (Touch gestures)

### Utilities
- **uuid:** ^13.0.0 (Unique ID generation)
- **react-native-get-random-values:** ^2.0.0 (Crypto polyfill)
- **expo-status-bar:** ~3.0.8 (Status bar control)

### Development Tools
- **TypeScript:** ~5.9.2
- **ESLint:** ^9.25.1
- **Prettier:** ^3.2.5

---

## Architecture

### Architecture Pattern
The application follows a **component-based architecture** with:
- **File-based routing** (Expo Router)
- **Centralized state management** (MobX stores)
- **Separation of concerns** (stores, components, utilities)
- **Observer pattern** for reactive UI updates

### Key Architectural Decisions

1. **MobX for State Management**
   - Reactive and observable state
   - Automatic UI updates when state changes
   - Simple API for complex state logic
   - Persistence integration with AsyncStorage

2. **Expo Router for Navigation**
   - File-based routing (similar to Next.js)
   - Type-safe navigation
   - Automatic deep linking support
   - Nested routing with groups

3. **Singleton Store Pattern**
   - Auth store as singleton (no context needed)
   - Direct imports for simplicity
   - Observer components for reactivity

4. **Platform-Aware Permissions**
   - Different permission strategies for iOS/Android
   - Write-only permissions on Android/Expo Go
   - Graceful degradation when permissions denied

---

## Project Structure

```
expo-go-villa-sample/
├── src/
│   ├── app/                    # Expo Router screens
│   │   ├── _layout.tsx        # Root layout with providers
│   │   ├── login.tsx           # Login screen
│   │   ├── register.tsx       # Registration screen
│   │   └── (app)/              # Protected app group
│   │       ├── _layout.tsx    # Tab navigation layout
│   │       ├── album.tsx      # Photo album screen
│   │       ├── camera-advanced.tsx  # Camera with effects
│   │       ├── photo.tsx      # Photo editor screen
│   │       ├── history.tsx    # Edit history screen
│   │       ├── settings.tsx    # Settings screen
│   │       └── details.tsx    # App info screen
│   ├── stores/                 # MobX stores
│   │   ├── auth-store.tsx     # Authentication store
│   │   ├── camera-store.ts    # Camera preferences store
│   │   ├── history-store.ts   # Edit history store
│   │   └── index.tsx          # Store provider & exports
│   ├── components/            # Reusable UI components
│   │   └── ui/                # UI component library
│   ├── lib/                   # Utility functions
│   │   ├── camera-permissions.ts  # Permission helpers
│   │   ├── date.ts            # Date formatting
│   │   └── tint.ts            # Color utilities
│   └── translations/          # i18n resources
├── app.json                   # Expo configuration
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

---

## Core Features

### 1. Camera with Real-time Effects
- **Live Preview:** Real-time camera preview with applied effects
- **Effect Types:**
  - **None:** Original camera view
  - **Night Vision:** Green-tinted overlay simulating night vision
  - **Thermal:** Red/orange overlay simulating thermal imaging
  - **Tint:** Customizable color overlay with adjustable strength
- **Adjustable Strength:** Slider controls for effect intensity (0-100%)
- **Circular Capture Button:** Large, accessible capture button

### 2. Photo Editing
- **Effect Application:** Apply effects to captured or selected photos
- **Real-time Preview:** See changes before exporting
- **Strength Control:** Fine-tune effect intensity
- **Color Picker:** Choose from predefined tint colors
- **Export to Gallery:** Save edited photos to device gallery

### 3. Album Management
- **Device Photos:** Display photos from device album (when permission granted)
- **Recent Captures:** Show recently captured photos
- **Local Fallback:** Display local-only images when read permission denied
- **Gallery Picker:** Select photos from device gallery
- **Local Image Deletion:** Remove local-only images individually or clear all

### 4. Edit History
- **Comprehensive Tracking:** Track all photo edits with metadata
- **Draft & Exported States:** Distinguish between in-progress and completed edits
- **Filtering:** Filter by "All", "Drafts", or "Exported"
- **Sorting:** Sort by "Newest" or "Oldest"
- **Resume Editing:** Continue editing from where you left off
- **Re-edit:** Create new edits based on previous ones
- **Delete Entries:** Remove individual or all history entries

### 5. Authentication
- **Local Authentication:** Email/password-based login
- **User Registration:** Create new accounts with email validation
- **Session Persistence:** Stay logged in across app restarts
- **Protected Routes:** All app features require authentication
- **Sign Out:** Secure logout with session clearing

### 6. Settings
- **Camera Preferences:** Set default look, tint color, and effect strengths
- **Account Management:** View sign-in status and sign out
- **Persistent Settings:** All preferences saved to AsyncStorage

---

## State Management

### MobX Stores

#### 1. AuthStore (`src/stores/auth-store.tsx`)

**Purpose:** Manages user authentication state and user accounts.

**State Properties:**
- `signedIn: boolean` - Current authentication status
- `email: string | null` - Currently signed-in user's email
- `loading: boolean` - Loading state for async operations
- `error: string | null` - Error message from last operation

**Methods:**
- `init(): Promise<void>` - Initialize store, load session and users
- `register(email, password): Promise<void>` - Register new user
- `login(email, password): Promise<void>` - Sign in existing user
- `logout(): Promise<void>` - Sign out current user
- `isValidEmail(email): boolean` - Validate email format

**Storage:**
- Users map: `auth.users.v1` (AsyncStorage)
- Session: `auth.session.v1` (AsyncStorage)

**Usage:**
```typescript
import { useAuth } from "@/stores/auth-store";
const auth = useAuth();
if (auth.signedIn) { /* user is authenticated */ }
```

#### 2. CameraStore (`src/stores/camera-store.ts`)

**Purpose:** Manages camera preferences and recent photo captures.

**State Properties:**
- `look: Look` - Default effect type ("none" | "night" | "thermal" | "tint")
- `tint: string` - Default tint color (hex)
- `night: number` - Default night effect strength (0-1)
- `thermal: number` - Default thermal effect strength (0-1)
- `tintAlpha: number` - Default tint effect strength (0-1)
- `recent: Shot[]` - Array of recently captured photos

**Methods:**
- `setLook(v: Look)` - Set default effect
- `setTint(v: string)` - Set default tint color
- `setNight(v: number)` - Set night strength
- `setThermal(v: number)` - Set thermal strength
- `setTintAlpha(v: number)` - Set tint strength
- `pushShot(uri: string)` - Add photo to recent list
- `removeShot(id: string)` - Remove photo from recent
- `removeLocalByUri(uri: string)` - Remove local image by URI
- `clearShots()` - Clear all recent photos
- `clearLocal()` - Clear all local-only images

**Persistence:** Automatically persisted via `mobx-persist-store` to `CameraStore.v1`

#### 3. HistoryStore (`src/stores/history-store.ts`)

**Purpose:** Tracks photo editing history with metadata.

**State Properties:**
- `recentEdits: EditEntry[]` - Array of all edit entries
- `filter: 'all' | 'drafts' | 'exported'` - Current filter
- `sort: 'newest' | 'oldest'` - Current sort order

**EditEntry Type:**
```typescript
type EditEntry = {
  id: string;                    // UUID v4
  sourceUri: string;             // Original image URI
  effect: 'none' | 'night' | 'thermal' | 'tint';
  tintHex?: string;              // Tint color (if effect is 'tint')
  strength: number;              // Effect strength (0-1)
  exportedUri?: string;          // Exported image URI (if exported)
  status: 'draft' | 'exported';  // Current status
  createdAt: number;             // Timestamp
  updatedAt: number;             // Last update timestamp
}
```

**Methods:**
- `addDraft(entryLike): EditEntry` - Create new draft entry
- `markExported(id, exportedUri)` - Mark entry as exported
- `deleteEdit(id)` - Remove entry by ID
- `clearEdits()` - Clear all entries
- `setFilter(v)` - Set filter type
- `setSort(v)` - Set sort order

**Computed:**
- `filteredSortedEdits: EditEntry[]` - Filtered and sorted entries

**Persistence:** Automatically persisted via `mobx-persist-store` to `HistoryStore`

**De-duplication:** Prevents duplicate entries based on `sourceUri + effect + createdAt` (within 1-second bucket)

---

## Authentication System

### Overview
The application uses a **local authentication system** with email and password. All user data is stored locally in AsyncStorage (not suitable for production, but appropriate for coursework).

### Implementation Details

#### User Storage
- **Location:** AsyncStorage key `auth.users.v1`
- **Format:** JSON object mapping email (lowercase) to password
  ```json
  {
    "user@example.com": "password123"
  }
  ```

#### Session Storage
- **Location:** AsyncStorage key `auth.session.v1`
- **Format:** JSON object with email
  ```json
  {
    "email": "user@example.com"
  }
  ```

#### Registration Flow
1. User enters email and password (min 6 characters)
2. Email is validated (format check)
3. System checks if email already exists
4. If valid, user is created and auto-logged in
5. Session is saved to AsyncStorage

#### Login Flow
1. User enters email and password
2. System looks up user in AsyncStorage
3. Password is compared (plain text for coursework)
4. If valid, session is created and user is signed in
5. App redirects to Camera+ tab

#### Logout Flow
1. Session is removed from AsyncStorage
2. `signedIn` flag is set to `false`
3. `email` is cleared
4. User is redirected to login screen

#### Route Protection
- All routes in `(app)/` group are protected
- `_layout.tsx` checks `authStore.signedIn`
- If not signed in, redirects to `/login`
- Login and register screens are public

### Security Considerations (Coursework Context)
⚠️ **Note:** This is a coursework demonstration. For production:
- Passwords should be hashed (e.g., SHA-256, bcrypt)
- Use secure storage (e.g., Keychain, Keystore)
- Implement token-based authentication
- Add rate limiting and account lockout
- Use HTTPS for any network requests

---

## Navigation Structure

### Route Groups

#### Public Routes
- `/login` - Login screen
- `/register` - Registration screen
- `/onboarding` - Onboarding (if implemented)

#### Protected Routes (`(app)/` group)
All routes require authentication. Tab navigation:

1. **Album** (`/(app)/album`)
   - View device photos and recent captures
   - Pick photos from gallery
   - Navigate to editor

2. **Camera+** (`/(app)/camera-advanced`)
   - Main camera interface
   - Real-time effects
   - Capture photos
   - Initial route after login

3. **History** (`/(app)/history`)
   - View edit history
   - Filter and sort entries
   - Resume or re-edit photos

4. **Settings** (`/(app)/settings`)
   - Camera preferences
   - Account management
   - Sign out

5. **Details** (`/(app)/details`)
   - App information
   - Version and credits

#### Hidden Routes
- `/(app)/index` - Redirects to camera-advanced
- `/(app)/photo` - Photo editor (modal-like)
- `/(app)/camera-settings` - Merged into settings
- `/(app)/style` - Removed
- `/(app)/process` - Removed

### Navigation Flow

```
Login/Register
    ↓ (success)
Camera+ (initial tab)
    ↓
[Tab Navigation]
    ├─ Album → Pick Photo → Photo Editor
    ├─ Camera+ → Capture → Photo Editor
    ├─ History → Resume/Re-edit → Photo Editor
    ├─ Settings → Sign Out → Login
    └─ Details (info only)
```

---

## Screen Details

### 1. Login Screen (`src/app/login.tsx`)

**Purpose:** Authenticate existing users.

**Features:**
- Email input (auto-capitalize disabled, email keyboard)
- Password input (secure text entry)
- Login button (disabled until valid)
- Error message display
- Link to registration
- Safe area handling
- Keyboard avoidance

**Validation:**
- Email format validation
- Password minimum 6 characters
- Button disabled during loading

**Navigation:**
- Success → `/(app)/camera-advanced`
- Error → Display error message

### 2. Register Screen (`src/app/register.tsx`)

**Purpose:** Create new user accounts.

**Features:**
- Email input
- Password input (min 6 characters)
- Register button
- Error message display
- Link to login
- Same layout as login (SafeArea, KeyboardAvoiding)

**Validation:**
- Email format validation
- Password length validation (≥6)
- Duplicate email check

**Navigation:**
- Success → Auto-login → `/(app)/camera-advanced`
- Error → Display error message

### 3. Camera+ Screen (`src/app/(app)/camera-advanced.tsx`)

**Purpose:** Main camera interface with real-time effects.

**Features:**
- Live camera preview
- Effect selector (None, Night, Thermal, Tint)
- Strength slider (for selected effect)
- Tint color picker (when Tint selected)
- Circular capture button
- Permission handling
- Recent captures display

**Effects:**
- **None:** Original camera view
- **Night:** Green overlay with adjustable strength
- **Thermal:** Red/orange overlay with adjustable strength
- **Tint:** Color overlay with customizable color and strength

**Navigation:**
- Capture → Photo Editor (`/(app)/photo`)
- Album button → Album screen

### 4. Photo Editor Screen (`src/app/(app)/photo.tsx`)

**Purpose:** Edit photos with effects and export.

**Features:**
- Image preview
- Effect selector
- Strength slider
- Tint color picker
- Export button
- Back button
- Auto-export support (via params)

**Modes:**
- `new` - New edit (creates draft)
- `edit` - Edit existing (updates or creates draft)

**Parameters:**
- `mode: 'new' | 'edit'`
- `sourceUri: string`
- `effect: string`
- `tintHex: string`
- `strength: string`
- `editId?: string` (for resume)
- `autoExport?: 'true'` (auto-export on load)

**Export Flow:**
1. Capture view as image (ViewShot)
2. Request write permission
3. Save to gallery (MediaLibrary.createAssetAsync)
4. If read permission: add to album
5. Update history entry (mark as exported)
6. Show success message

**Navigation:**
- Back → Album screen
- Export → Stay on screen, show success

### 5. Album Screen (`src/app/(app)/album.tsx`)

**Purpose:** Browse device photos and recent captures.

**Features:**
- Device photos grid (when read permission granted)
- Recent captures grid
- Local-only images (fallback)
- "Pick from Gallery" button
- "Retry Read" button (if permission denied)
- Delete button on local images
- "Clear local" button

**Permission Handling:**
- Checks read permission on mount
- Only loads device album if `canRead === true`
- Shows fallback for local images if no read permission
- Guards all `getAlbumAsync` calls

**Navigation:**
- Pick photo → Create draft → Photo Editor
- Tap image → Photo Editor (if implemented)

### 6. History Screen (`src/app/(app)/history.tsx`)

**Purpose:** View and manage edit history.

**Features:**
- Filter chips (All, Drafts, Exported)
- Sort toggle (Newest/Oldest)
- Scrollable filter row
- History list with thumbnails
- Entry details (effect, strength, date, URI)
- Status badges (Draft/Exported)
- Action buttons:
  - **Resume** (drafts) - Continue editing
  - **Export** (drafts) - Export draft
  - **Re-edit** (exported) - Create new edit from exported
  - **Delete** - Remove entry
- Clear history button
- Empty state with "Go to Camera+" button

**Entry Display:**
- Thumbnail (exported URI or source URI)
- Effect name with tint info
- Status badge (green for exported, gray for draft)
- Strength percentage
- Formatted date (relative or absolute)
- URI tail (monospace, truncated)

**Navigation:**
- Resume → Photo Editor (with editId)
- Re-edit → Photo Editor (new draft)
- Export → Photo Editor (auto-export)

### 7. Settings Screen (`src/app/(app)/settings.tsx`)

**Purpose:** Configure camera preferences and manage account.

**Features:**
- **Camera Settings:**
  - Default look selector
  - Default tint color picker
  - Tint strength slider
  - Night strength slider
  - Thermal strength slider
  - Save button
- **Account Section:**
  - Sign-in status display
  - Sign out button (if signed in)

**Persistence:**
- Settings saved to AsyncStorage (`STORAGE_CAMERA_PREFS`)
- Loaded on mount

**Navigation:**
- Sign out → Login screen

### 8. Details Screen (`src/app/(app)/details.tsx`)

**Purpose:** Display app information.

**Features:**
- App name
- Version information
- Description
- Credits
- Links to documentation

**Content:**
- Static information about the app
- No dynamic data or history

---

## Photo Editing Workflow

### Workflow Diagram

```
1. Capture/Select Photo
   ├─ Camera+ → Capture
   └─ Album → Pick from Gallery
        ↓
2. Create Draft Entry
   └─ HistoryStore.addDraft()
        ↓
3. Navigate to Photo Editor
   └─ Params: sourceUri, effect, strength, editId
        ↓
4. Apply Effects
   ├─ Select effect type
   ├─ Adjust strength
   └─ Choose tint color (if tint)
        ↓
5. Export
   ├─ Capture view (ViewShot)
   ├─ Save to gallery
   ├─ Add to album (if permission)
   └─ Mark as exported (HistoryStore.markExported)
        ↓
6. History Entry Updated
   └─ Status: 'draft' → 'exported'
```

### Draft Lifecycle

1. **Creation:** When user picks/captures photo → `addDraft()` creates entry with `status: 'draft'`
2. **Editing:** User can resume editing from History → Opens editor with `editId`
3. **Export:** When exported → `markExported()` updates entry with `exportedUri` and `status: 'exported'`
4. **Re-edit:** User can create new draft from exported entry (no `editId`)

### Export Process

1. **Capture View:**
   ```typescript
   const uri = await viewRef.current.capture({ format: "jpg", quality: 0.9 });
   ```

2. **Permission Check:**
   ```typescript
   const { canWrite } = await getMediaPermission();
   if (!canWrite) { /* show error */ }
   ```

3. **Save Asset:**
   ```typescript
   const asset = await MediaLibrary.createAssetAsync(uri);
   ```

4. **Add to Album (if read permission):**
   ```typescript
   if (canRead) {
     let album = await MediaLibrary.getAlbumAsync(ALBUM);
     if (!album) {
       album = await MediaLibrary.createAlbumAsync(ALBUM, asset, false);
     } else {
       await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
     }
   }
   ```

5. **Update History:**
   ```typescript
   if (editId) {
     history.markExported(editId, asset.uri);
   }
   ```

---

## History System

### Data Model

Each history entry contains:
- **ID:** UUID v4 (unique identifier)
- **Source URI:** Original image location
- **Effect:** Applied effect type
- **Tint Hex:** Color (if tint effect)
- **Strength:** Effect intensity (0-1)
- **Exported URI:** Saved image location (if exported)
- **Status:** Draft or Exported
- **Timestamps:** Created and updated dates

### Filtering

- **All:** Show all entries
- **Drafts:** Only entries with `status: 'draft'`
- **Exported:** Only entries with `status: 'exported'`

### Sorting

- **Newest:** Most recent first (descending by `createdAt`)
- **Oldest:** Oldest first (ascending by `createdAt`)

### Actions

1. **Resume (Draft):**
   - Opens editor with existing `editId`
   - Loads previous effect/strength/color
   - Updates entry on export

2. **Export (Draft):**
   - Opens editor with `autoExport: true`
   - Automatically exports on load

3. **Re-edit (Exported):**
   - Creates new draft entry
   - Uses same source URI and effect settings
   - No `editId` (new entry)

4. **Delete:**
   - Removes entry from history
   - Confirmation alert before deletion

### De-duplication

Prevents duplicate entries by checking:
- Same `sourceUri`
- Same `effect`
- Same `createdAt` (within 1-second bucket)

If match found, returns existing entry instead of creating new one.

---

## Permissions Handling

### Permission Strategy

The application uses a **platform-aware permission strategy** to handle iOS and Android differences, especially in Expo Go.

### Camera Permission

**Request:**
```typescript
await Camera.requestCameraPermissionsAsync();
```

**Usage:**
- Required for camera preview and capture
- Requested on app start (in `_layout.tsx`)
- Checked before showing camera

### Media Library Permission

**Platform Differences:**

#### iOS
- Single permission request (`requestPermissionsAsync()`)
- Grants both read and write access
- `canRead === canWrite === granted`

#### Android (Expo Go)
- Write-only permission (`requestPermissionsAsync(true)`)
- Read permissions may not be available in Expo Go
- `canRead === false` (always)
- `canWrite === granted`

**Implementation:**
```typescript
// src/lib/camera-permissions.ts
export async function requestMediaPermission(): Promise<MediaPerm> {
  if (Platform.OS === "ios") {
    const p = await MediaLibrary.requestPermissionsAsync();
    return { canRead: p.granted, canWrite: p.granted };
  }
  // Android: WRITE ONLY
  const p = await MediaLibrary.requestPermissionsAsync(true);
  return { canRead: false, canWrite: !!p.granted };
}
```

**Guarded Operations:**
- **Always allowed:** `createAssetAsync()` (if write permission)
- **Guarded:** `getAlbumAsync()`, `getAssetsAsync()` (only if `canRead === true`)

### Permission Flow

1. **App Start:**
   - Request camera permission
   - Request media write permission
   - Don't request read (may fail on Android/Expo Go)

2. **Export:**
   - Check write permission
   - Save asset (always if write granted)
   - Only manage album if read granted

3. **Album Load:**
   - Check read permission
   - Only load device photos if `canRead === true`
   - Show local fallback if no read permission

### Permission Messages

**iOS (app.json):**
```json
"NSPhotoLibraryUsageDescription": "Allow access to your photo library to select and save images.",
"NSPhotoLibraryAddUsageDescription": "Allow saving edited images to your photo library.",
"NSCameraUsageDescription": "Allow camera access to take photos."
```

**Android (app.json):**
```json
"permissions": [
  "READ_MEDIA_IMAGES",
  "WRITE_EXTERNAL_STORAGE",
  "CAMERA"
]
```

---

## Data Persistence

### Storage Locations

#### 1. Authentication Data
- **Users:** `auth.users.v1` (AsyncStorage)
- **Session:** `auth.session.v1` (AsyncStorage)

#### 2. Camera Preferences
- **Key:** `camera.prefs.v1` (AsyncStorage)
- **Content:** Default look, tint, effect strengths

#### 3. MobX Persistence
- **CameraStore:** `CameraStore.v1` (via mobx-persist-store)
- **HistoryStore:** `HistoryStore` (via mobx-persist-store)

### Persistence Strategy

#### MobX Persistence
Uses `mobx-persist-store` for automatic persistence:
```typescript
makePersistable(this, {
  name: "StoreName",
  properties: ["property1", "property2"],
  storage: AsyncStorage,
});
```

**Benefits:**
- Automatic save on state change
- Automatic load on store creation
- Type-safe property selection

#### Manual Persistence
For non-MobX data (camera preferences):
```typescript
await AsyncStorage.setItem(key, JSON.stringify(data));
const data = JSON.parse(await AsyncStorage.getItem(key));
```

### Data Lifecycle

1. **On App Start:**
   - MobX stores auto-hydrate from AsyncStorage
   - Auth store loads session (auto-login if session exists)
   - Camera preferences load from AsyncStorage

2. **On State Change:**
   - MobX stores auto-save (debounced)
   - Manual saves for camera preferences

3. **On Logout:**
   - Session cleared
   - User data remains (for re-login)

4. **On Clear:**
   - History clear removes all entries
   - Local images clear removes recent captures

---

## UI/UX Design

### Design Principles

1. **Simplicity:** Clean, minimal interface
2. **Accessibility:** Large touch targets, clear labels
3. **Feedback:** Loading states, error messages, success confirmations
4. **Consistency:** Unified button styles, spacing, colors

### Color Scheme

- **Primary:** Dark (#222) for buttons
- **Secondary:** Gray (#666) for text
- **Success:** Green (#10b981) for exported badges
- **Draft:** Gray (#9ca3af) for draft badges
- **Error:** Red (#ef4444) for errors
- **Background:** White (#fff) for screens

### Typography

- **Headings:** 28px, bold (700)
- **Subheadings:** 18px, bold (700)
- **Body:** 16px, regular (400)
- **Small:** 14px, regular (400)
- **Tiny:** 11-12px, monospace for URIs

### Spacing

- **Screen Padding:** 16px
- **Component Gap:** 8-12px
- **Section Margin:** 24px
- **Safe Area:** Handled by SafeAreaView

### Components

#### Buttons
- **Primary:** Dark background, white text
- **Outline:** Border, transparent background
- **Disabled:** Gray, reduced opacity
- **Size Variants:** `sm`, `md`, `lg`

#### Inputs
- **Border:** 1px, #ddd
- **Border Radius:** 8px
- **Padding:** 12px
- **Background:** White

#### Cards
- **Border:** 1px, #e5e7eb
- **Border Radius:** 12px
- **Padding:** 12px
- **Background:** White

### Safe Area Handling

All auth screens use:
```typescript
<SafeAreaView style={{ flex: 1 }}>
  <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 32 }}>
      {/* Content */}
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
```

### Keyboard Handling

- **KeyboardAvoidingView:** Adjusts layout when keyboard appears
- **ScrollView:** Allows scrolling when content exceeds screen
- **keyboardShouldPersistTaps:** "handled" to allow button presses

### Loading States

- **Button Disabled:** During async operations
- **Loading Text:** "Signing in...", "Creating account...", "Saving..."
- **Spinner:** (If implemented)

### Error Handling

- **Inline Errors:** Red text below inputs
- **Alert Dialogs:** For critical actions (delete, clear)
- **Toast Messages:** (If implemented via FlashMessage)

---

## Development Setup

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Expo Go app on iOS/Android device
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd expo-go-villa-sample

# Install dependencies
npm install
# or
yarn install

# Start development server
npx expo start
# or
npm start
```

### Running the App

1. **Start Metro Bundler:**
   ```bash
   npx expo start
   ```

2. **Open in Expo Go:**
   - Scan QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator, `a` for Android emulator

3. **Clear Cache (if needed):**
   ```bash
   npx expo start -c
   ```

### Development Commands

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web

# Lint code
npm run lint

# Format code
npm run format

# Type check
npx tsc --noEmit
```

### Project Configuration

#### TypeScript
- **Config:** `tsconfig.json`
- **Strict Mode:** Enabled
- **Path Aliases:** `@/` → `src/`

#### ESLint
- **Config:** `eslint.config.js`
- **Rules:** Expo recommended + custom
- **No Duplicate Imports:** Enforced

#### Prettier
- **Config:** `.prettierrc`
- **Plugins:** Tailwind CSS

### Environment Variables

No environment variables required for local development.

### Debugging

- **React Native Debugger:** For React DevTools
- **MobX DevTools:** (If configured)
- **Console Logs:** Available in Metro bundler
- **Expo DevTools:** Built into Expo Go

---

## Known Limitations

### 1. Expo Go Constraints

- **Media Library Read:** Limited on Android/Expo Go
  - Solution: Write-only permissions, local fallback
- **Performance:** May be slower than production builds
  - Solution: Use development builds for testing

### 2. Authentication

- **Plain Text Passwords:** Not secure for production
  - Solution: Use hashing (SHA-256, bcrypt) in production
- **Local Storage Only:** No cloud sync
  - Solution: Implement backend API for production

### 3. Photo Storage

- **Local Only:** Photos stored on device
  - Solution: Implement cloud storage (Firebase, AWS S3)
- **No Compression:** Large file sizes
  - Solution: Add image compression before export

### 4. History Management

- **No Search:** Can't search by filename or date range
  - Solution: Add search functionality
- **Limited Metadata:** No tags or categories
  - Solution: Add tagging system

### 5. Effects

- **Basic Overlays:** Simple color filters, not advanced processing
  - Solution: Integrate image processing library (e.g., react-native-image-manipulator)

### 6. Performance

- **Large History:** May slow down with many entries
  - Solution: Implement pagination or virtualization
- **Image Loading:** No caching strategy
  - Solution: Add image caching (expo-image with cache)

### 7. Error Handling

- **Limited Recovery:** Some errors may require app restart
  - Solution: Add retry mechanisms and better error boundaries

### 8. Accessibility

- **Basic Support:** Not fully accessible
  - Solution: Add accessibility labels, VoiceOver support

---

## Future Enhancements

### Short-term

1. **Password Hashing:** Implement SHA-256 or bcrypt
2. **Image Compression:** Reduce file sizes before export
3. **Search in History:** Filter by filename or date
4. **Better Error Messages:** More descriptive error handling
5. **Loading Indicators:** Spinners for async operations

### Medium-term

1. **Cloud Sync:** Backend API for user data and photos
2. **Advanced Effects:** More sophisticated image filters
3. **Batch Operations:** Select and export multiple photos
4. **Export Formats:** Support for PNG, WebP
5. **Share Functionality:** Share photos to other apps

### Long-term

1. **User Profiles:** Profile pictures, display names
2. **Social Features:** Share edits with other users
3. **Presets:** Save and reuse effect combinations
4. **Video Support:** Apply effects to video
5. **AI Enhancements:** Auto-enhance, object detection

---

## Conclusion

This application demonstrates a comprehensive photo editing solution built with React Native and Expo. It showcases:

- **Modern React Native Development:** Expo SDK 54, Expo Router, TypeScript
- **State Management:** MobX with persistence
- **Authentication:** Local user management
- **Media Integration:** Camera and photo library access
- **Real-time Effects:** Live preview with overlays
- **History Tracking:** Comprehensive edit history
- **Platform Awareness:** iOS/Android permission handling

The application is suitable for coursework demonstration and can be extended for production use with proper security measures and backend integration.

---

## Appendix

### Key Files Reference

- **Auth Store:** `src/stores/auth-store.tsx`
- **Camera Store:** `src/stores/camera-store.ts`
- **History Store:** `src/stores/history-store.ts`
- **Permissions:** `src/lib/camera-permissions.ts`
- **Root Layout:** `src/app/_layout.tsx`
- **App Layout:** `src/app/(app)/_layout.tsx`
- **Camera Screen:** `src/app/(app)/camera-advanced.tsx`
- **Photo Editor:** `src/app/(app)/photo.tsx`
- **History:** `src/app/(app)/history.tsx`

### Useful Commands

```bash
# Clear all caches
npx expo start -c

# Reset Metro bundler
rm -rf node_modules/.cache

# Clear AsyncStorage (development)
# Use React Native Debugger or add dev button
```

### Contact & Support

For issues or questions, refer to:
- Expo Documentation: https://docs.expo.dev
- React Native Documentation: https://reactnative.dev
- MobX Documentation: https://mobx.js.org

---

**Report Generated:** 2025  
**Application Version:** 1.0.0  
**Last Updated:** Current


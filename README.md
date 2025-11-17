# 📱 Expo Go Villa Sample - Mobile Development Learning Project

Welcome to your first React Native mobile app! This project is designed to help you learn mobile development using Expo Go - no simulators or complex setup required, just your phone and some basic tools.

## 🎯 What You'll Learn

- React Native fundamentals
- Mobile UI components and styling with NativeWind (Tailwind CSS)
- Navigation between screens
- Form handling and validation
- State management
- Local storage
- Internationalization (i18n)
- Authentication flows

## 📋 Prerequisites

Before you start, make sure you have:
- A smartphone (iOS or Android)
- A computer with internet connection
- Both devices connected to the **same WiFi network**

## 🛠️ Installation Guide

### Step 1: Install Node.js
1. Go to [nodejs.org](https://nodejs.org/)
2. Download and install the **LTS version** (recommended)
3. Verify installation by opening terminal/command prompt and typing:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Install Yarn (Package Manager)
```bash
npm install -g yarn
```
Verify installation:
```bash
yarn --version
```

### Step 3: Install Expo CLI
```bash
npm install -g @expo/cli
```

### Step 4: Install Expo Go App on Your Phone

#### For iOS:
- Open App Store
- Search for "Expo Go"
- Install the app

#### For Android:
- Open Google Play Store
- Search for "Expo Go"
- Install the app

## 🚀 Getting Started

### 1. Clone/Download This Project
```bash
# Clone the repository
git clone https://github.com/Yasir5247/RN-ExpoGo-Villa-Sample.git
cd RN-ExpoGo-Villa-Sample

# Or download the ZIP file from GitHub and extract it
```

**Alternative: Download ZIP**
1. Go to [https://github.com/Yasir5247/RN-ExpoGo-Villa-Sample](https://github.com/Yasir5247/RN-ExpoGo-Villa-Sample)
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the downloaded file

### 2. Install Dependencies
```bash
yarn install
```

### 3. Start the Development Server
```bash
yarn start
```

You should see something like this:
```
Starting Metro Bundler
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▄▄▄ ▀█▄█▄█ ▄▄▄▄▄ █
█ █   █ ██▄▀ █ ▀▄▄█ █   █ █
█ █▄▄▄█ ██▀▄ ▄███▀█ █▄▄▄█ █
▄▄▄▄▄▄▄█ ▀▄█ ▀▄█▄█▄▄▄▄▄▄▄█
...

› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### 4. Open the App on Your Phone

#### For iOS:
1. Open the **Camera** app
2. Point it at the QR code on your computer screen
3. Tap the notification that appears
4. The app will open in Expo Go

#### For Android:
1. Open the **Expo Go** app
2. Tap "Scan QR Code"
3. Point your camera at the QR code on your computer screen
4. The app will load automatically


### 3.1 Camera dependencies (once)
```bash
yarn add expo-camera expo-media-library expo-haptics expo-linear-gradient react-native-webview
# If using Expo-managed workflow, you can also do:
# npx expo install expo-camera expo-media-library expo-haptics expo-linear-gradient react-native-webview

## 🔧 Development Commands

```bash
# Start the development server
yarn start

# Start with iOS simulator (if you have Xcode installed)
yarn ios

# Start with Android emulator (if you have Android Studio installed)
yarn android

# Start web version
yarn web

# Run linting
yarn lint

# Format code
yarn format
```

## 📱 Features in This App

### 🎨 UI Components
- **Buttons**: Various styles and states
- **Forms**: Login form with validation
- **Cards**: Display content beautifully
- **Navigation**: Tab navigation and stack navigation
- **Modals**: Bottom sheets and overlays

### 🎯 Functionality
- **Authentication**: Login/logout flow
- **Storage**: Persistent data storage
- **Theming**: Light/dark mode support
- **Internationalization**: Multi-language support
- **Form Validation**: Using Zod and React Hook Form

### 🛠️ Technologies Used
- **React Native**: Mobile app framework
- **Expo**: Development platform
- **NativeWind**: Tailwind CSS for React Native
- **Expo Router**: File-based navigation
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **AsyncStorage**: Local data storage

### 📷 Camera+
- Live preview with overlays: **none / night / thermal / tint**
- **Front/Back** toggle, **Flash** cycle (Off → On → Auto)
- **Capture** saves photos to album **“NabhanCamera”** (Media Library)
- Horizontal **Recent** gallery (delete, process preview)
- **Process** preview: “keep red ink” (grayscale everything else) via WebView

## 🐛 Troubleshooting

### App Won't Load?
1. **Check WiFi**: Ensure both devices are on the same network
2. **Restart Metro**: Press `r` in the terminal to reload
3. **Clear Cache**: Press `Shift + r` for a full reload
4. **Restart Expo Go**: Close and reopen the Expo Go app

### QR Code Not Working?
1. **Manual Connection**: In Expo Go, tap "Enter URL manually" and type the URL shown in terminal
2. **Network Issues**: Try connecting to a different WiFi network
3. **Firewall**: Check if your computer's firewall is blocking the connection
## How to Use Camera+
1. Open the app and go to the **Camera+** tab.
2. Grant **Camera** and **Media Library** permissions when asked.
3. Use the top row to switch **Front/Back**, change **Flash**, and **Capture**.
4. Pick a look: **none / night / thermal / tint**. In **tint**, tap a color chip.
5. Captured photos appear in **Recent** (album: _NabhanCamera_). You can **Delete** or **Process**.
6. **Process** shows a preview that keeps red ink and grayscales everything else (for sketch clarity).


- **Camera shows black screen**: Close Expo Go, run `yarn start --reset-cache`, reopen.
- **No photos saved**: On the phone, enable Photos/Media permission for Expo Go in system settings.
- Android / Expo Go: album read may be restricted; app falls back to local list but can still save via write-only permission.

### Development Server Issues?
```bash
# Clear Expo cache
expo start --clear

# Reset Metro cache
yarn start --reset-cache
```

## 📚 Learning Path

### Beginner Level
1. **Explore the UI**: Navigate through different screens
2. **Modify Text**: Change some text content and see live updates
3. **Styling**: Experiment with NativeWind classes
4. **Components**: Look at how components are structured

### Intermediate Level
1. **Add New Screens**: Create additional pages
2. **Form Handling**: Build new forms with validation
3. **State Management**: Add new features with local state
4. **Storage**: Implement data persistence

### Advanced Level
1. **API Integration**: Connect to external services
2. **Custom Components**: Build reusable UI components
3. **Performance**: Optimize app performance
4. **Testing**: Add unit and integration tests

## 📖 File Structure

```
src/
├── app/                    # App screens (file-based routing)
│   ├── (app)/             # Protected app screens
│   ├── login.tsx          # Login screen
│   ├── onboarding.tsx     # Onboarding screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── ...               # Feature components
├── lib/                  # Utilities and configurations
│   ├── auth/             # Authentication logic
│   ├── hooks/            # Custom React hooks
│   ├── i18n/             # Internationalization
│   └── storage.tsx       # Local storage utilities
└── translations/         # Language files
```

## 🤝 Getting Help

1. **Read the Code**: Comments explain what each part does
2. **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
3. **React Native Docs**: [reactnative.dev](https://reactnative.dev)
4. **Ask Questions**: Don't hesitate to ask your instructor

## 🎉 Next Steps

Once you're comfortable with this project:
1. Try building your own screens
2. Add new features
3. Experiment with different UI components
4. Build your own app from scratch

---

**Happy Coding! 🚀**

*Remember: The best way to learn is by doing. Don't be afraid to break things - that's how you learn!*



## Camera+ (Drawio Resizer idea)
- Live overlays: none / night / thermal / tint (color swatches)
- Toggle front/back camera, cycle flash (off/on/auto)
- Capture → saves to album **“NabhanCamera”**; Recent gallery shows latest shots
- Delete photo; “Process” opens preview that desaturates everything except red ink (WebView demo)

Run:
npm install
npx expo start
Open the **Camera+** tab in Expo Go.

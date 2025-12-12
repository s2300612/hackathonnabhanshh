# White Screen Diagnostic Report
## Sirru App - Expo Router + React Native

**Generated:** $(date)  
**Status:** Diagnostic analysis of potential white screen causes

---

## Executive Summary

After analyzing the codebase, I've identified **8 potential root causes** for a white screen issue. The most likely culprits are:

1. **Store hydration timing issue** (HIGH PROBABILITY)
2. **Redirect component not rendering properly** (MEDIUM PROBABILITY)
3. **Missing error boundaries** (MEDIUM PROBABILITY)
4. **Onboarding animation blocking render** (LOW PROBABILITY)

---

## Critical Issues Found

### 🔴 CRITICAL: Store Hydration Race Condition

**Location:** `src/app/index.tsx` + `src/stores/user-store.ts`

**Issue:**
The `hydrated` flag in Zustand persist middleware may not be set synchronously. The `onRehydrateStorage` callback uses `setTimeout` which creates a race condition:

```typescript
// In user-store.ts line 82
setTimeout(() => useUserStore.setState({ hydrated: true }), 0);
```

**Why it causes white screen:**
- `index.tsx` waits for `hydrated === true` before rendering anything
- If `onRehydrateStorage` callback never fires or fires late, `hydrated` stays `false`
- Component stays in loading state indefinitely → white screen

**Evidence:**
- Line 25-30 in `index.tsx`: Shows loading spinner ONLY if `hydrated === false`
- If hydration never completes, spinner never shows → white background visible
- Fallback timer is 100ms, but if hydration fails, this won't help

**Fix Priority:** 🔴 HIGHEST

---

### 🟡 MEDIUM: Redirect Component May Not Render

**Location:** `src/app/index.tsx` lines 34-38

**Issue:**
Using `<Redirect>` component from expo-router. If navigation is blocked or router isn't ready, Redirect may not work and component returns nothing → white screen.

```typescript
if (hasOnboarded) {
  return <Redirect href="/(app)/home" />;
}
return <Redirect href="/onboarding" />;
```

**Why it causes white screen:**
- `Redirect` is a declarative component that may not render anything visually
- If navigation fails silently, no error shown, just empty render
- Root layout has `backgroundColor` in styles, but if child doesn't render, might show default white

**Evidence:**
- No error handling around Redirect
- No fallback UI if Redirect fails
- Root layout (`_layout.tsx`) uses `DarkTheme` but theme might not apply to empty renders

**Fix Priority:** 🟡 MEDIUM

---

### 🟡 MEDIUM: No Error Boundaries

**Location:** Entire app structure

**Issue:**
No error boundaries found in the codebase. If ANY component throws an error during render, React will show a blank screen in production.

**Components at risk:**
- `src/app/index.tsx` - Uses hooks that could fail
- `src/components/pulse-map.tsx` - Uses Zustand hooks
- `src/components/aava-chart.tsx` - Uses useMemo with date parsing
- `src/app/onboarding.tsx` - Complex animations that could fail

**Why it causes white screen:**
- Uncaught errors during render = white screen in React Native
- No error UI or fallback component
- Errors might be swallowed in Expo Go

**Evidence:**
```bash
grep -r "ErrorBoundary\|componentDidCatch\|getDerivedStateFromError" src/
# Result: No matches found
```

**Fix Priority:** 🟡 MEDIUM

---

### 🟢 LOW: Onboarding Animation Starts at White

**Location:** `src/app/onboarding.tsx` line 36

**Issue:**
The onboarding screen animation starts with white background:

```typescript
const bgAnim = useRef(new Animated.Value(0)).current; // 0 = white
// ...
const bgColor = bgAnim.interpolate({
  inputRange: [0, 1, 2],
  outputRange: ["#ffffff", "#008B8B", "#020617"], // white → teal → dark
});
```

**Why it might look like white screen:**
- If user is redirected to `/onboarding` but animation hasn't started
- Brief flash of white before animation begins
- Animation uses `useEffect` which runs after first render

**Evidence:**
- Animation starts in `useEffect` (line 49) - runs after mount
- First render will show white (#ffffff) background
- User might see white screen if they navigate quickly

**Fix Priority:** 🟢 LOW (visual polish issue)

---

### 🟡 MEDIUM: Root Layout Background Color

**Location:** `src/app/_layout.tsx` line 33

**Issue:**
StatusBar is set to `style="light"` and theme uses `DarkTheme`, but:

```typescript
<GestureHandlerRootView style={styles.container}>
  // styles.container = { flex: 1 } - NO BACKGROUND COLOR
```

**Why it causes white screen:**
- Root container has no explicit background color
- If child components don't render or have transparent backgrounds, system default (white) shows through
- `DarkTheme` from React Navigation only applies to navigation components, not root View

**Evidence:**
- `GestureHandlerRootView` has no backgroundColor
- `SafeAreaProvider` has no backgroundColor
- White is system default background color

**Fix Priority:** 🟡 MEDIUM

---

### 🟢 LOW: Components Returning Null

**Location:** `src/app/(app)/index.tsx`

**Issue:**
This component returns `null`:

```typescript
export default function AppIndexRedirect() {
  useEffect(() => {
    router.replace("/(app)/home");
  }, []);
  return null; // ← Returns nothing
}
```

**Why it might cause issues:**
- If this route is accidentally matched, renders nothing
- Not the root cause (unlikely to be hit) but contributes to empty renders

**Fix Priority:** 🟢 LOW

---

### 🟡 MEDIUM: Store Initialization Dependencies

**Location:** `src/stores/index.tsx` + `src/app/_layout.tsx`

**Issue:**
Store providers are set up correctly, but if stores throw errors during initialization:

```typescript
const cameraStore = new CameraStore(); // Line 9 - runs at module load
```

If `CameraStore` constructor throws, entire app fails to load.

**Why it causes white screen:**
- Module-level code executes before React renders
- If it throws, app crashes before any UI shows
- No try/catch around store initialization

**Fix Priority:** 🟡 MEDIUM

---

### 🟢 LOW: AsyncStorage Access Issues

**Location:** `src/stores/user-store.ts` line 64

**Issue:**
If AsyncStorage is unavailable or permissions denied:

```typescript
getStorage: () => AsyncStorage,
```

Zustand persist might fail silently or throw, causing hydration to never complete.

**Why it causes white screen:**
- Hydration never completes → `hydrated` stays `false`
- App stuck on loading state
- No error handling for storage failures

**Fix Priority:** 🟢 LOW (rare in Expo Go)

---

## Recommended Fixes (Priority Order)

### 1. 🔴 URGENT: Fix Hydration Timing

**File:** `src/app/index.tsx`

Add a more robust fallback and error handling:

```typescript
export default function Index() {
  const hydrated = useUserStore((s) => s.hydrated);
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  
  // More aggressive fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentHydrated = useUserStore.getState().hydrated;
      if (!currentHydrated) {
        console.warn('Hydration timeout - forcing hydrated state');
        useUserStore.setState({ hydrated: true });
      }
    }, 500); // Increased from 100ms
    
    return () => clearTimeout(timer);
  }, []);

  // Always show something, even if hydration fails
  if (!hydrated) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        backgroundColor: "#121212" // Ensure dark background
      }}>
        <ActivityIndicator size="large" color="#00FFE0" />
      </View>
    );
  }

  // Rest of code...
}
```

### 2. 🟡 HIGH: Add Error Boundary

**File:** `src/app/_layout.tsx`

```typescript
import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error) {
    console.error('App Error:', error);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
          <Text style={{ color: 'white' }}>Something went wrong. Please reload the app.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {/* rest of code */}
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
```

### 3. 🟡 MEDIUM: Add Background Color to Root

**File:** `src/app/_layout.tsx`

```typescript
const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#121212' // Add this
  },
});
```

### 4. 🟡 MEDIUM: Add Navigation Fallback

**File:** `src/app/index.tsx`

```typescript
// Instead of just Redirect, add fallback
if (hasOnboarded) {
  return (
    <>
      <Redirect href="/(app)/home" />
      <View style={{ position: 'absolute', opacity: 0 }}>
        <Text>Loading...</Text>
      </View>
    </>
  );
}
```

### 5. 🟢 LOW: Fix Onboarding Initial Color

**File:** `src/app/onboarding.tsx`

```typescript
// Start animation value at 2 (dark) instead of 0 (white)
const bgAnim = useRef(new Animated.Value(2)).current; // Start at dark

// Or add initial background
<Animated.View style={{ 
  flex: 1, 
  backgroundColor: bgColor || "#020617" // Fallback to dark
}}>
```

---

## Debugging Steps

1. **Check Metro logs** for errors during app launch
2. **Add console.logs** in `index.tsx` to see hydration state:
   ```typescript
   console.log('Hydrated:', hydrated, 'Onboarded:', hasOnboarded);
   ```
3. **Check AsyncStorage** - verify it's accessible in Expo Go
4. **Test with fresh install** - clear app data and reinstall
5. **Check React Native Debugger** for component tree

---

## Quick Test

Add this temporary debug code to `src/app/index.tsx`:

```typescript
export default function Index() {
  const hydrated = useUserStore((s) => s.hydrated);
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  
  // TEMPORARY DEBUG
  console.log('[Index] Hydrated:', hydrated, 'Onboarded:', hasOnboarded);
  
  // Force show something always
  return (
    <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white' }}>
        Hydrated: {String(hydrated)} | Onboarded: {String(hasOnboarded)}
      </Text>
      {/* Rest of logic */}
    </View>
  );
}
```

This will help identify if the issue is hydration or navigation.

---

## Summary

**Most Likely Cause:** Store hydration never completing, causing infinite loading state that appears as white screen.

**Quick Fix:** Add error boundary + background color to root + increase hydration timeout.

**Long-term Fix:** Refactor hydration to use Zustand's built-in hydration check or use a more reliable pattern.


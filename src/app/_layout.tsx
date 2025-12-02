// app/_layout.tsx
import "../../global.css";
import React, { useState, createContext, useContext, useEffect } from "react";
import { Stack, useRouter, usePathname, useSegments, Slot } from "expo-router";
import { ThemeProvider, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import FlashMessage from "react-native-flash-message";
import { StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { StoresProvider } from "@/stores";
import { SafeAreaProvider } from "react-native-safe-area-context";
/*
- Root layout component that sets up app-wide providers
- `Gate` component: Simple pass-through wrapper (auth routing handled in `(app)/_layout.tsx`)
- `RootLayout`: Wraps app with providers (SafeAreaProvider, StoresProvider, ThemeProvider, etc.)
- Provides FlashMessage component for toast notifications
*/
// simple contexts i had to add
const ThemeContext = createContext({ dark: false });
const APIContext = createContext({});

function APIProvider({ children }: { children: React.ReactNode }) {
  return <APIContext.Provider value={{}}>{children}</APIContext.Provider>;
}

function Providers({ children }: { children: React.ReactNode }) {
  const [isDark] = useState(false); // kinda useless in this case
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="dark" />
        <ThemeContext.Provider value={{ dark: isDark }}>
          <ThemeProvider value={navigationTheme}>
            <APIProvider>
              <BottomSheetModalProvider>
                {children}
                <FlashMessage position="top" />
              </BottomSheetModalProvider>
            </APIProvider>
          </ThemeProvider>
        </ThemeContext.Provider>
    </GestureHandlerRootView>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoresProvider>
    <Providers>
      <Gate>
            <Slot />
      </Gate>
    </Providers>
      </StoresProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

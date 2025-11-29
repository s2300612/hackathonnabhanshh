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

// --- simple contexts you had ---
const ThemeContext = createContext({ dark: false });
const APIContext = createContext({});

function APIProvider({ children }: { children: React.ReactNode }) {
  return <APIContext.Provider value={{}}>{children}</APIContext.Provider>;
}

function Providers({ children }: { children: React.ReactNode }) {
  const [isDark] = useState(false); // no setter needed unless you toggle
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

// --- Auth gate: redirects between public and protected areas ---
// Note: The (app)/_layout.tsx now handles auth routing, so this Gate is simplified
function Gate({ children }: { children: React.ReactNode }) {
  // The (app)/_layout.tsx handles the actual auth checks and redirects
  // This Gate just passes through for now
  return <>{children}</>;
}



// ---- SINGLE default export (keep just this one) ----
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

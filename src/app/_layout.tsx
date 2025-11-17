// app/_layout.tsx
import "../../global.css";
import React, { useState, createContext, useContext, useEffect } from "react";
import { Stack, useRouter, usePathname, useSegments } from "expo-router";
import { ThemeProvider, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import FlashMessage from "react-native-flash-message";
import { StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "@/lib/auth"; // if alias fails, use ../src/lib/auth

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
      <AuthProvider>
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
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// --- Auth gate: redirects between public and protected areas ---
function Gate({ children }: { children: React.ReactNode }) {
  const { token, status } = useAuth();           // 'idle' | 'signOut' | 'signIn'
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();                 // e.g. "/login", "/register", "/(app)"
  const loading = status === "idle";   

  const inProtected = pathname === "/" || segments[0] === "(app)";

  React.useEffect(() => {
  if (loading) return;

  if (!token && inProtected && pathname !== "/login") {
    router.replace("/login");
    return;
  }

  if (token && !inProtected && pathname !== "/") {
    router.replace("/");
  }
}, [loading, token, inProtected, pathname, router]);


  console.log("GATE", { status, hasToken: !!token, pathname, segments, inProtected });
  return loading ? null : <>{children}</>;
}



// ---- SINGLE default export (keep just this one) ----
export default function RootLayout() {
  return (
    <Providers>
      <Gate>
        <Stack>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack>
      </Gate>
    </Providers>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

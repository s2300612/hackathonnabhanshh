// src/app/(app)/_layout.tsx
import React from "react";
import { Tabs, Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import { View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authStore } from "@/stores/auth-store";
import { Ionicons } from "@expo/vector-icons";

function ProtectedTabs() {
  const insets = useSafeAreaInsets();

  // Wait for hydration before checking auth status
  if (!authStore.hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If not signed in, redirect to login
  if (!authStore.signedIn) {
    return <Redirect href="/login" />;
    }
  
  return (
    <Tabs
      initialRouteName="camera-advanced"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingBottom: Math.max(10, insets.bottom),
          paddingTop: 6,
        },
        tabBarItemStyle: { paddingVertical: 4 },
        }}
    >
      <Tabs.Screen
        name="album"
        options={{
          title: "Album",
          tabBarIcon: ({ color, size }) => <Ionicons name="images-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="camera-advanced"
        options={{
          title: "Camera+",
          tabBarIcon: ({ color, size }) => <Ionicons name="camera-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="details"
        options={{
          title: "Details",
          tabBarIcon: ({ color, size }) => <Ionicons name="information-circle-outline" color={color} size={size} />,
        }}
      />
      {/* Hide any dev/stub routes */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="camera-settings" options={{ href: null }} />
      <Tabs.Screen name="process" options={{ href: null }} />
      <Tabs.Screen name="photo" options={{ href: null }} />
      <Tabs.Screen name="viewer" options={{ href: null }} />
    </Tabs>
  );
}

export default observer(ProtectedTabs);

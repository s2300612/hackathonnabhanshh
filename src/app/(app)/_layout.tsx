// src/app/(app)/_layout.tsx
import React from "react";
import { Tabs, Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/auth-store";
import { Ionicons } from "@expo/vector-icons";

function ProtectedTabs() {
  // If not signed in, redirect to login
  if (!authStore.signedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs initialRouteName="camera-advanced" screenOptions={{ headerShown: true, tabBarHideOnKeyboard: true }}>
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
      <Tabs.Screen name="style" options={{ href: null }} />
      <Tabs.Screen name="camera-settings" options={{ href: null }} />
      <Tabs.Screen name="process" options={{ href: null }} />
      <Tabs.Screen name="photo" options={{ href: null }} />
    </Tabs>
  );
}

export default observer(ProtectedTabs);

// src/app/(app)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function SirruTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingBottom: Math.max(10, insets.bottom),
          paddingTop: 6,
          backgroundColor: "#121212",
          borderTopColor: "rgba(255,255,255,0.08)",
        },
        tabBarActiveTintColor: "#00FFE0",
        tabBarInactiveTintColor: "#A0A0A0",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="koamas"
        options={{
          title: "Koamas",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="faru"
        options={{
          title: "Faru",
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="breathing"
        options={{
          title: "Breathing",
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse-outline" color={color} size={size} />,
        }}
      />
      {/* Hide legacy routes */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="camera-advanced" options={{ href: null }} />
      <Tabs.Screen name="album" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="details" options={{ href: null }} />
      <Tabs.Screen name="camera-settings" options={{ href: null }} />
      <Tabs.Screen name="process" options={{ href: null }} />
      <Tabs.Screen name="photo" options={{ href: null }} />
      <Tabs.Screen name="viewer" options={{ href: null }} />
    </Tabs>
  );
}

// src/app/(app)/_layout.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import TutorialOverlay from "@/components/TutorialOverlay";

export default function SirruTabs() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
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
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
          }}
        />
        {/* Hide index route from tab bar */}
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
      <TutorialOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

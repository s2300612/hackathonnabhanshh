import React from "react";
import { View, Text, Linking, ScrollView } from "react-native";
import { Stack } from "expo-router";
import Constants from "expo-constants";

export default function DetailsImpl() {
  const v = Constants?.expoConfig?.version ?? "dev";
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Stack.Screen options={{ title: "Details" }} />
      <Text style={{ fontSize: 18, fontWeight: "700" }}>Drawio Resizer — Camera+</Text>
      <Text>Version: {v}</Text>
      <Text>Lightweight camera with overlays (night/thermal/tint), editor preview, and explicit export-to-gallery.</Text>
      <Text style={{ marginTop: 12, fontWeight: "600" }}>Credits</Text>
      <Text>- Expo Camera, MediaLibrary, ViewShot</Text>
      <Text>- Built with Expo + React Native</Text>
      <Text style={{ marginTop: 12, color: "#2563eb" }} onPress={() => Linking.openURL("https://docs.expo.dev")}>
        Expo Docs
      </Text>
      <Text style={{ marginTop: 8, color: "#2563eb" }} onPress={() => Linking.openURL("https://gitlab.uwe.ac.uk/an3-aboobakuru/mobiledev3rdnov")}>
        Project README
      </Text>
    </ScrollView>
  );
}

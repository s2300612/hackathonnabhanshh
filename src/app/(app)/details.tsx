import React from "react";
import { View, Text, Linking, ScrollView } from "react-native";
import { Stack, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useStores } from "@/stores";

export default function DetailsImpl() {
  const router = useRouter();
  const { auth } = useStores();
  const v = Constants?.expoConfig?.version ?? "dev";

  React.useEffect(() => {
    if (!auth.signedIn) router.replace("/login");
  }, [auth.signedIn, router]);
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
      
      <View style={{ marginTop: 24, padding: 12, backgroundColor: "#fef3c7", borderRadius: 8, borderWidth: 1, borderColor: "#fbbf24" }}>
        <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#92400e" }}>
          Known Expo Go Limitations
        </Text>
        <Text style={{ color: "#78350f", lineHeight: 20 }}>
          • On Android, read access to the photo library may be limited in Expo Go due to manifest constraints.
        </Text>
        <Text style={{ color: "#78350f", lineHeight: 20, marginTop: 4 }}>
          • Album reading requires full Photos permission, which may not be available in Expo Go on Android 13+.
        </Text>
        <Text style={{ color: "#78350f", lineHeight: 20, marginTop: 4 }}>
          • Exporting photos still works (write permission), but organizing into albums requires read access.
        </Text>
        <Text style={{ color: "#78350f", lineHeight: 20, marginTop: 4 }}>
          • For full functionality, use a development build or standalone app instead of Expo Go.
        </Text>
      </View>
    </ScrollView>
  );
}

import React from "react";
import { View, Text, Linking, ScrollView } from "react-native";
import Constants from "expo-constants";
import { Button } from "@/components/ui/button";

export default function Details() {
  const v = Constants?.expoConfig?.version ?? "dev";
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Details</Text>
      <Text>App: Drawio Resizer — Camera+</Text>
      <Text>Version: {v}</Text>
      <Text>Credits:</Text>
      <Text>• Built with Expo + React Native.</Text>
      <Text>• Overlays by you (night / thermal / tint).</Text>
      <Text>• Media handling via expo-media-library.</Text>
      <Text>
        Storage: Photos save to the NabhanCamera album when Media/Photos permission is granted. If Android/Expo Go blocks
        reads, we keep a local fallback list and you can use the Export button to move shots into the system gallery later.
      </Text>
      <Text>Permissions: Camera plus Media/Photos (write-only fallback on Android/Expo Go).</Text>
      <Text>Privacy: All processing stays on device; nothing is uploaded.</Text>
      <Button
        label="Project README"
        onPress={() => Linking.openURL("https://gitlab.uwe.ac.uk/an3-aboobakuru/mobiledev3rdnov")}
        fullWidth={false}
        size="sm"
      />
    </ScrollView>
  );
}

import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";

export default function SettingsScreen() {
  const { signOut, token } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16 }}>
        <Text>Signed in: {token ? "Yes" : "No"}</Text>

        <Pressable
          onPress={signOut}             // Gate will take you to /login
          style={{ padding: 12, borderRadius: 10, backgroundColor: "#e53935" }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

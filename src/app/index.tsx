import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useUserStore } from "@/stores/user-store";

export default function Index() {
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);

  useEffect(() => {
    console.log("[Index] mounted. hasOnboarded =", hasOnboarded);
  }, [hasOnboarded]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#020617",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
      }}
    >
      <Text style={{ color: "white", marginBottom: 16, textAlign: "center" }}>
        Debug Index Screen{"\n"}
        hasOnboarded: {String(hasOnboarded)}
      </Text>

      <TouchableOpacity
        onPress={() => router.replace("/onboarding")}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 999,
          backgroundColor: "#00FFE0",
          marginBottom: 8,
        }}
      >
        <Text style={{ color: "#020617", fontWeight: "bold" }}>
          Go to Onboarding
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/(app)/home")}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 999,
          backgroundColor: "#00FFE0",
        }}
      >
        <Text style={{ color: "#020617", fontWeight: "bold" }}>
          Go to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
}


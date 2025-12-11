import React, { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import PulseMap from "@/components/pulse-map";
import AavaChart from "@/components/aava-chart";
import CheckinModal from "@/components/checkin-modal";
import { useCheckinStore } from "@/stores/checkin-store";
import { useUserStore } from "@/stores/user-store";
import { router } from "expo-router";

export default function HomeScreen() {
  const pulses = useCheckinStore((s) => s.pulses);
  const profile = useUserStore((s) => s.profile);
  const [showCheckin, setShowCheckin] = useState(false);

  return (
    <View className="flex-1 bg-[#121212]">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-white text-2xl font-bold mb-1">Sirru — You're not alone.</Text>
        <Text className="text-gray-400 mb-4">
          {profile ? `${profile.nickname} in ${profile.atoll}` : "Anonymous mode"}
        </Text>
        <PulseMap pulses={pulses} />
        <TouchableOpacity
          onPress={() => (profile ? setShowCheckin(true) : router.replace("/onboarding"))}
          className="mt-4 bg-[#00FFE0] rounded-full py-3"
        >
          <Text className="text-black text-center font-semibold">
            {profile ? "Check In" : "Finish onboarding"}
          </Text>
        </TouchableOpacity>
        <View className="mt-6">
          <AavaChart />
        </View>
        <View className="mt-6 rounded-3xl p-4 bg-[#1E1E1E] border border-white/10">
          <Text className="text-white text-lg font-semibold mb-2">Need support right now?</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/(app)/koamas")}
              className="flex-1 bg-[#2A2A2A] rounded-2xl p-3 border border-white/10"
            >
              <Text className="text-white font-semibold">🫂 Talk to Koamas</Text>
              <Text className="text-gray-400 text-sm">Culturally-aware AI friend</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(app)/breathing")}
              className="flex-1 bg-[#2A2A2A] rounded-2xl p-3 border border-white/10"
            >
              <Text className="text-white font-semibold">🌬️ Breathing</Text>
              <Text className="text-gray-400 text-sm">1-minute box breathing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <CheckinModal visible={showCheckin} onClose={() => setShowCheckin(false)} />
    </View>
  );
}


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
          <Text className="text-black text-center font-semibold">Check In</Text>
        </TouchableOpacity>
        <View className="mt-6">
          <AavaChart />
        </View>
        <View className="mt-6 rounded-3xl p-4 bg-[#1E1E1E] border border-white/10">
          <Text className="text-white text-lg font-semibold mb-3">Need support right now?</Text>
          <View className="space-y-3">
            <View className="bg-[#2A2A2A] rounded-2xl p-3 border border-white/10">
              <Text className="text-white font-semibold">📞 Primary Crisis Hotline</Text>
              <Text className="text-gray-300 text-base mt-1">1425</Text>
              <Text className="text-gray-400 text-sm">24/7</Text>
            </View>
            <View className="bg-[#2A2A2A] rounded-2xl p-3 border border-white/10">
              <Text className="text-white font-semibold">📞 Mental Health Helpline (Thibaa)</Text>
              <Text className="text-gray-300 text-base mt-1">722 1212</Text>
              <Text className="text-gray-400 text-sm">9 AM – 10 PM, daily</Text>
            </View>
            <View className="bg-[#2A2A2A] rounded-2xl p-3 border border-white/10">
              <Text className="text-white font-semibold">🚨 Emergency Line</Text>
              <Text className="text-gray-300 text-base mt-1">119</Text>
              <Text className="text-gray-400 text-sm">24/7</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <CheckinModal visible={showCheckin} onClose={() => setShowCheckin(false)} />
    </View>
  );
}


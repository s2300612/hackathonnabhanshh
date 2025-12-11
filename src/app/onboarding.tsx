import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { useUserStore } from "@/stores/user-store";

const atolls = [
  { code: "HA", name: "Haa Alif" },
  { code: "HDh", name: "Haa Dhaalu" },
  { code: "Sh", name: "Shaviyani" },
  { code: "N", name: "Noonu" },
  { code: "R", name: "Raa" },
  { code: "B", name: "Baa" },
  { code: "Lh", name: "Lhaviyani" },
  { code: "K", name: "Kaafu (Malé)" },
  { code: "AA", name: "Alif Alif" },
  { code: "ADh", name: "Alif Dhaalu" },
  { code: "V", name: "Vaavu" },
  { code: "M", name: "Meemu" },
  { code: "F", name: "Faafu" },
  { code: "Dh", name: "Dhaalu" },
  { code: "Th", name: "Thaa" },
  { code: "L", name: "Laamu" },
  { code: "GA", name: "Gaafu Alif" },
  { code: "GDh", name: "Gaafu Dhaalu" },
  { code: "Gn", name: "Gnaviyani (Fuvahmulah)" },
  { code: "S", name: "Seenu (Addu)" },
];

export default function Onboarding() {
  const setProfile = useUserStore((s) => s.setProfile);
  const [nickname, setNickname] = useState("");
  const [atoll, setAtoll] = useState("");

  const canContinue = useMemo(() => nickname.trim().length > 1 && atoll.length > 0, [nickname, atoll]);

  const handleContinue = () => {
    if (!canContinue) return;
    setProfile(nickname.trim(), atoll);
    router.replace("/(app)/home");
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1 bg-[#121212]">
      <View className="mt-16">
        <Text className="text-white text-3xl font-bold text-center">Sirru</Text>
        <Text className="text-gray-400 text-center mt-2">No names. No judgment. Just you.</Text>
      </View>
      <View className="mt-10 bg-[#1E1E1E] rounded-3xl p-4 border border-white/10">
        <Text className="text-white text-lg font-semibold mb-2">Pick a nickname</Text>
        <TextInput
          placeholder="Anything you like"
          placeholderTextColor="#6b7280"
          value={nickname}
          onChangeText={setNickname}
          className="bg-[#121212] text-white rounded-2xl px-4 py-3 border border-white/10"
        />
      </View>
      <View className="mt-4 bg-[#1E1E1E] rounded-3xl p-4 border border-white/10">
        <Text className="text-white text-lg font-semibold mb-2">Which atoll are you in?</Text>
        <View className="max-h-80">
          {atolls.map((item) => (
            <TouchableOpacity
              key={item.code}
              onPress={() => setAtoll(item.code)}
              className={`py-3 px-3 rounded-2xl mb-2 border ${
                atoll === item.code ? "border-[#00FFE0] bg-[#00FFE0]/10" : "border-white/10 bg-[#121212]"
              }`}
            >
              <Text className="text-white font-semibold">{item.name}</Text>
              <Text className="text-gray-500 text-xs">{item.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity
        onPress={handleContinue}
        disabled={!canContinue}
        className={`mt-6 rounded-full py-3 ${canContinue ? "bg-[#00FFE0]" : "bg-gray-700"}`}
      >
        <Text className="text-black text-center font-semibold">Enter Sirru</Text>
      </TouchableOpacity>
      <Text className="text-gray-500 text-xs text-center mt-3">
        Anonymous by design. We only store nickname + atoll on device.
      </Text>
    </ScrollView>
  );
}

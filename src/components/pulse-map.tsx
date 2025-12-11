import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Pulse, useCheckinStore } from "@/stores/checkin-store";

type Props = {
  pulses?: Pulse[];
};

const atollNames: Record<string, string> = {
  HA: "Haa Alif",
  HDh: "Haa Dhaalu",
  Sh: "Shaviyani",
  N: "Noonu",
  R: "Raa",
  B: "Baa",
  Lh: "Lhaviyani",
  K: "Kaafu (Malé)",
  AA: "Alif Alif",
  ADh: "Alif Dhaalu",
  V: "Vaavu",
  M: "Meemu",
  F: "Faafu",
  Dh: "Dhaalu",
  Th: "Thaa",
  L: "Laamu",
  GA: "Gaafu Alif",
  GDh: "Gaafu Dhaalu",
  Gn: "Gnaviyani",
  S: "Seenu (Addu)",
};

export default function PulseMap({ pulses }: Props) {
  const { seedIfEmpty } = useCheckinStore();

  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

  const toRender = pulses ?? [];

  return (
    <View className="bg-[#1E1E1E] rounded-3xl p-4 border border-white/10">
      <Text className="text-white text-lg font-semibold mb-2">Pulse Map</Text>
      <Text className="text-gray-400 text-sm mb-3">
        Real-time emotional weather across Maldives (last 24h).
      </Text>
      {toRender.length === 0 ? (
        <Text className="text-gray-500">No check-ins yet. Be the first to add a pulse.</Text>
      ) : (
        toRender.slice(0, 12).map((pulse) => (
          <View
            key={pulse.id}
            className="flex-row items-center justify-between py-2 border-b border-white/5"
          >
            <View className="flex-1">
              <Text className="text-white font-medium">
                {pulse.mood === "sunny" ? "☀️ Sunny" : "⛈️ Stormy"}
                {pulse.mine ? " · You" : ""}
              </Text>
              <Text className="text-gray-500 text-xs">
                {atollNames[pulse.atoll] ?? pulse.atoll}
              </Text>
            </View>
            <Text className="text-gray-400 text-xs">
              {new Date(pulse.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        ))
      )}
      {toRender.length > 12 ? (
        <Text className="text-gray-500 text-xs mt-2">
          +{toRender.length - 12} more pulses breathing in the background
        </Text>
      ) : null}
    </View>
  );
}


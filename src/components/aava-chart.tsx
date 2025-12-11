import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useCheckinStore } from "@/stores/checkin-store";

type Bucket = { hour: number; sunny: number; stormy: number };

export default function AavaChart() {
  const pulses = useCheckinStore((s) => s.pulses);

  const buckets = useMemo<Bucket[]>(() => {
    const init: Bucket[] = Array.from({ length: 24 }).map((_, hour) => ({
      hour,
      sunny: 0,
      stormy: 0,
    }));
    pulses.forEach((p) => {
      const date = new Date(p.createdAt);
      const hour = date.getHours();
      if (p.mood === "sunny") init[hour].sunny += 1;
      else init[hour].stormy += 1;
    });
    return init;
  }, [pulses]);

  const maxTotal = Math.max(
    1,
    ...buckets.map((b) => b.sunny + b.stormy)
  );

  return (
    <View className="bg-[#1E1E1E] rounded-3xl p-4 border border-white/10">
      <Text className="text-white text-lg font-semibold mb-2">Aava (The Tide)</Text>
      <Text className="text-gray-400 text-sm mb-3">
        Mood balance over the last 24 hours (higher = more stormy).
      </Text>
      <View className="flex-row items-end gap-1 h-40">
        {buckets.map((bucket) => {
          const total = bucket.sunny + bucket.stormy;
          const ratio = total / maxTotal;
          const height = Math.max(6, ratio * 140);
          return (
            <View key={bucket.hour} className="flex-1 items-center">
              <View
                style={{ height, backgroundColor: "#6366F1", opacity: 0.8 }}
                className="w-full rounded-full"
              />
              <Text className="text-[10px] text-gray-500 mt-1">{bucket.hour}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}


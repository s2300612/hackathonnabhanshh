import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";

const phases = ["Inhale", "Hold", "Exhale", "Hold"] as const;

export default function BreathingScreen() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const phase = phases[phaseIndex];
  const totalSteps = 4 * 4; // four phases, four cycles

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setStep((prev) => {
        const next = prev + 1;
        if (next >= totalSteps) {
          setRunning(false);
          return prev;
        }
        return next;
      });
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [running]);

  const progress = useMemo(() => {
    if (!running) return 0;
    return Math.min(1, step / totalSteps);
  }, [step, running]);

  const handleStart = () => {
    setStep(0);
    setPhaseIndex(0);
    setRunning(true);
  };

  return (
    <View className="flex-1 bg-[#121212] items-center justify-center px-6">
      <Text className="text-white text-2xl font-bold mb-2">Box Breathing</Text>
      <Text className="text-gray-400 mb-8 text-center">
        4 seconds inhale → 4 hold → 4 exhale → 4 hold. Four cycles, about one minute.
      </Text>
      <View
        className="w-56 h-56 rounded-3xl items-center justify-center"
        style={{
          backgroundColor: "rgba(0,255,224,0.1)",
          borderColor: "#00FFE0",
          borderWidth: 1,
          transform: [{ scale: 1 + progress * 0.12 }],
        }}
      >
        <Text className="text-[#00FFE0] text-xl font-semibold">{phase}</Text>
      </View>
      <Text className="text-gray-300 mt-6">
        Cycle {Math.min(4, Math.floor(step / phases.length) + 1)} / 4
      </Text>
      <TouchableOpacity
        onPress={handleStart}
        className="mt-8 bg-[#00FFE0] rounded-full px-6 py-3"
      >
        <Text className="text-black font-semibold">{running ? "Reset" : "Start breathing"}</Text>
      </TouchableOpacity>
    </View>
  );
}


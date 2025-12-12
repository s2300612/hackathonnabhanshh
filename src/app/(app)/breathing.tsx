import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BoxBreathingCore from "@/features/breathing/BoxBreathingCore";

export default function BreathingScreen() {
  const [start, setStart] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleStart = () => {
    setStart(true);
    setIsComplete(false);
  };

  const handleReset = () => {
    setStart(false);
    setIsComplete(false);
    // Trigger re-render to restart
    setTimeout(() => setStart(true), 50);
  };

  const handleComplete = () => {
    setIsComplete(true);
    setStart(false);
  };

  return (
    <View className="flex-1 bg-[#121212] items-center justify-center px-6">
      <Text className="text-white text-2xl font-bold mb-2">Box Breathing</Text>
      <Text className="text-gray-400 mb-8 text-center">
        4 seconds inhale → 4 hold → 4 exhale → 4 hold. Four cycles, about one minute.
      </Text>
      <BoxBreathingCore 
        start={start} 
        onComplete={handleComplete} 
        size={224} 
        color="#00FFE0" 
      />
      {isComplete && (
        <Text className="text-gray-300 mt-6 text-center">Well done! 🌟</Text>
      )}
      <TouchableOpacity
        onPress={start ? handleReset : handleStart}
        className="mt-8 bg-[#00FFE0] rounded-full px-6 py-3"
      >
        <Text className="text-black font-semibold">{start ? "Reset" : "Start breathing"}</Text>
      </TouchableOpacity>
    </View>
  );
}


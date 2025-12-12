import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useUserStore } from "@/stores/user-store";
import { useTutorialStore } from "@/stores/tutorial-store";

export default function OnboardingDoneScreen() {
  const setHasOnboarded = useUserStore((s) => s.setHasOnboarded);
  const startTutorial = useTutorialStore((s) => s.startTutorial);

  useEffect(() => {
    // Mark onboarding as complete
    setHasOnboarded(true);
    
    // Start the tutorial overlay
    startTutorial();
    
    // Navigate to home - tutorial overlay will appear on top
    router.replace("/(app)/home");
  }, [setHasOnboarded, startTutorial]);

  // Show loading while transitioning
  return (
    <View className="flex-1 bg-[#121212] items-center justify-center">
      <ActivityIndicator size="large" color="#00FFE0" />
      <Text className="text-gray-400 mt-4">Entering Sirru...</Text>
    </View>
  );
}


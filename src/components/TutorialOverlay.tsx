import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTutorialStore } from "@/stores/tutorial-store";

const stepMessages: Record<string, string> = {
  home: "Here is your emotion map of Maldives. Each light is a mood pulse from someone like you.",
  koamas: "This is me — you can talk anonymously. I'm here 24/7, no judgment, just a warm friend.",
  breathing: "Try box breathing when you're stormy. Four cycles, about a minute. It helps anchor you.",
  faru: "This is the community wall — a quiet space where you can send simple stickers to say 'I'm here.'",
};

export default function TutorialOverlay() {
  const { isTutorialActive, step, nextStep, skipTutorial } = useTutorialStore();

  if (!isTutorialActive) {
    return null;
  }

  const handleNext = () => {
    // Navigate to the next screen based on current step
    switch (step) {
      case "home":
        router.replace("/(app)/koamas");
        break;
      case "koamas":
        router.replace("/(app)/breathing");
        break;
      case "breathing":
        router.replace("/(app)/faru");
        break;
      case "faru":
        router.replace("/(app)/home");
        break;
    }
    nextStep();
  };

  const handleSkip = () => {
    skipTutorial();
    // Navigate to home if not already there
    if (step !== "home") {
      router.replace("/(app)/home");
    }
  };

  const message = stepMessages[step] || "";

  return (
    <View style={styles.overlay}>
      <View style={styles.bubbleContainer}>
        {/* Koamas avatar (dolphin) */}
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🐬</Text>
        </View>
        
        {/* Koamas bubble */}
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{message}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 9999,
  },
  bubbleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  bubble: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bubbleText: {
    color: "#e5e7eb",
    fontSize: 15,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  skipButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#6b7280",
    paddingVertical: 12,
    alignItems: "center",
  },
  skipText: {
    color: "#e5e7eb",
    fontWeight: "600",
    fontSize: 15,
  },
  nextButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#00FFE0",
    paddingVertical: 12,
    alignItems: "center",
  },
  nextText: {
    color: "#020617",
    fontWeight: "700",
    fontSize: 15,
  },
});


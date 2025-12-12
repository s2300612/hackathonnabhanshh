import React, { useRef, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Animated, ScrollView } from "react-native";
import { router } from "expo-router";
import { useUserStore } from "@/stores/user-store";
import { useCheckinStore } from "@/stores/checkin-store";
import PulseMap from "@/components/pulse-map";
import { makeId } from "@/lib/make-id";

type Step = "map" | "breathing" | "sticker";

const seaCreatures = [
  { id: "turtle", emoji: "🐢", name: "Turtle" },
  { id: "octopus", emoji: "🐙", name: "Octopus" },
  { id: "shark", emoji: "🦈", name: "Shark" },
  { id: "crab", emoji: "🦀", name: "Crab" },
  { id: "fish", emoji: "🐠", name: "Fish" },
  { id: "shell", emoji: "🐚", name: "Shell" },
  { id: "dolphin", emoji: "🐬", name: "Dolphin" },
  { id: "whale", emoji: "🐋", name: "Whale" },
];

function pickCreature(seed: string) {
  const idx = Math.abs(seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % seaCreatures.length;
  return seaCreatures[idx];
}

export default function OnboardingDoneScreen() {
  const profile = useUserStore((s) => s.profile);
  const setHasOnboarded = useUserStore((s) => s.setHasOnboarded);
  const pulses = useCheckinStore((s) => s.pulses);
  const [step, setStep] = useState<Step>("map");
  const [breathingRunning, setBreathingRunning] = useState(false);
  const [breathingDone, setBreathingDone] = useState(false);
  const [anchored, setAnchored] = useState<boolean | null>(null);
  const [shared, setShared] = useState(false);
  const [stickerSent, setStickerSent] = useState(false);

  const nickname = profile?.nickname ?? "Friend";
  const creature = useMemo(() => pickCreature(profile?.deviceId ?? makeId()), [profile]);
  
  // Simulated anchor counter (in real app, this would come from Supabase)
  const anchorCount = 1200;

  // Box breathing animation
  const boxSize = useRef(new Animated.Value(80)).current;
  const boxOpacity = useRef(new Animated.Value(0.6)).current;

  function startBreathing() {
    setBreathingRunning(true);
    setBreathingDone(false);

    // 4-cycle box breathing: 4s inhale, 4s hold, 4s exhale, 4s hold (x4 cycles)
    const cycle = () => {
      return Animated.sequence([
        // Inhale
        Animated.parallel([
          Animated.timing(boxSize, {
            toValue: 160,
            duration: 4000,
            useNativeDriver: false,
          }),
          Animated.timing(boxOpacity, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
        // Hold (full)
        Animated.delay(4000),
        // Exhale
        Animated.parallel([
          Animated.timing(boxSize, {
            toValue: 80,
            duration: 4000,
            useNativeDriver: false,
          }),
          Animated.timing(boxOpacity, {
            toValue: 0.6,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
        // Hold (empty)
        Animated.delay(4000),
      ]);
    };

    Animated.sequence([cycle(), cycle(), cycle(), cycle()]).start(() => {
      setBreathingRunning(false);
      setBreathingDone(true);
    });
  }

  function renderKoamasBubble(text: string) {
    return (
      <View className="flex-row mb-4 items-start">
        <View className="w-10 h-10 rounded-full bg-[#1E1E1E] items-center justify-center mr-2">
          <Text className="text-2xl">🐟</Text>
        </View>
        <View className="flex-1 bg-[#1E1E1E] rounded-2xl px-4 py-3 border border-white/10">
          <Text className="text-gray-200">{text}</Text>
        </View>
      </View>
    );
  }

  function handleFinish() {
    setHasOnboarded(true);
    router.replace("/(app)/home");
  }

  return (
    <View className="flex-1 bg-[#121212]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}>
        {step === "map" && (
          <>
            {renderKoamasBubble(
              "Here is your emotion map of Maldives. Each light is a mood pulse from someone like you."
            )}

            {/* Map component */}
            <View className="mb-6">
              <PulseMap pulses={pulses} />
            </View>

            <TouchableOpacity
              onPress={() => setStep("breathing")}
              className="bg-[#00FFE0] rounded-full py-3"
            >
              <Text className="text-[#020617] text-center font-bold text-base">Next: Meet Koamas</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "breathing" && (
          <>
            {renderKoamasBubble("I'm Koamas. Want to try a 4-step breathing exercise with me?")}

            <View className="flex-1 items-center justify-center my-8 min-h-[300px]">
              <Animated.View
                style={{
                  width: boxSize,
                  height: boxSize,
                  backgroundColor: "#22c55e",
                  borderRadius: 16,
                  opacity: boxOpacity,
                }}
              />
              <Text className="text-gray-300 mt-6 text-center text-base">
                {breathingRunning
                  ? "Inhale... hold... exhale... hold..."
                  : breathingDone
                  ? "Well done! 🌟"
                  : "Tap Start to begin box breathing"}
              </Text>
            </View>

            {/* Confetti moment */}
            {breathingDone && (
              <View className="items-center mb-4">
                <Text className="text-[#22c55e] text-lg">✨ Confetti! ✨</Text>
                <Text className="text-gray-400 text-sm mt-1">You added a link to the Anchor Chain</Text>
              </View>
            )}

            {/* Ask if it anchored them */}
            {breathingDone && anchored === null && (
              <>
                {renderKoamasBubble("Did box breathing anchor you?")}
                <View className="flex-row gap-3 mb-4">
                  <TouchableOpacity
                    onPress={() => setAnchored(true)}
                    className="flex-1 bg-[#22c55e] rounded-full py-3"
                  >
                    <Text className="text-[#020617] text-center font-bold text-base">Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAnchored(false)}
                    className="flex-1 border border-gray-600 rounded-full py-3"
                  >
                    <Text className="text-gray-300 text-center font-semibold text-base">Not really</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Ask if they want to share */}
            {breathingDone && anchored === true && !shared && (
              <>
                {renderKoamasBubble("Would you like to share that box breathing anchored you?")}
                <View className="flex-row gap-3 mb-4">
                  <TouchableOpacity
                    onPress={() => setShared(true)}
                    className="flex-1 bg-[#00FFE0] rounded-full py-3"
                  >
                    <Text className="text-[#020617] text-center font-bold text-base">Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setStep("sticker")}
                    className="flex-1 border border-gray-600 rounded-full py-3"
                  >
                    <Text className="text-gray-300 text-center font-semibold text-base">Skip</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Show shared sticker and counter */}
            {shared && (
              <>
                <View className="bg-[#1E1E1E] rounded-2xl p-4 border border-white/10 mb-4">
                  <Text className="text-gray-300 mb-2">
                    {creature.emoji} {nickname}: "Box Breathing anchored me 🌬️"
                  </Text>
                  <Text className="text-gray-400 text-sm">🐟 Koamas: "That's wonderful! You're not alone."</Text>
                </View>
                <View className="bg-[#1E1E1E] rounded-2xl p-4 border border-white/10 mb-4">
                  <Text className="text-white text-center text-base">
                    <Text className="font-bold">{nickname}</Text> and{" "}
                    <Text className="font-bold">{anchorCount}</Text> other people found box breathing anchoring
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setStep("sticker")}
                  className="bg-[#00FFE0] rounded-full py-3"
                >
                  <Text className="text-[#020617] text-center font-bold text-base">
                    Next: Say hello in Faru
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* If they said not really, show next button */}
            {breathingDone && anchored === false && (
              <TouchableOpacity
                onPress={() => setStep("sticker")}
                className="bg-[#00FFE0] rounded-full py-3"
              >
                <Text className="text-[#020617] text-center font-bold text-base">
                  Next: Say hello in Faru
                </Text>
              </TouchableOpacity>
            )}

            {/* Start/Replay button */}
            {!breathingRunning && anchored === null && (
              <TouchableOpacity
                onPress={startBreathing}
                className="bg-[#00FFE0] rounded-full py-3 mb-3"
              >
                <Text className="text-[#020617] text-center font-bold text-base">
                  {breathingDone ? "Replay breathing" : "Start breathing"}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {step === "sticker" && (
          <>
            {renderKoamasBubble(
              'This is "Faru" – a quiet space where you can send simple stickers to say "I\'m here."'
            )}

            <View className="bg-[#1E1E1E] rounded-2xl p-4 border border-white/10 mb-6">
              <Text className="text-white font-semibold text-lg mb-2">Faru – community shoreline</Text>
              {!stickerSent ? (
                <Text className="text-gray-300">
                  Send a sticker that says "Hello" so others know you exist here.
                </Text>
              ) : (
                <View className="mt-2">
                  <Text className="text-gray-300 mb-2">
                    {creature.emoji} {nickname}: "Hello 👋" (tutorial sticker)
                  </Text>
                  <Text className="text-gray-400 text-sm">🐟 Koamas: "Hello back! Welcome to Faru."</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setStickerSent(true)}
              disabled={stickerSent}
              className={`rounded-full py-3 mb-3 ${
                stickerSent ? "bg-gray-700 opacity-60" : "bg-[#00FFE0]"
              }`}
            >
              <Text className="text-[#020617] text-center font-bold text-base">
                {stickerSent ? "Sticker sent ✓" : 'Send "Hello" sticker'}
              </Text>
            </TouchableOpacity>

            {stickerSent && (
              <>
                {renderKoamasBubble("Nice! I said hello back for you with my own sticker.")}
                <TouchableOpacity onPress={handleFinish} className="bg-[#00FFE0] rounded-full py-3 mt-4">
                  <Text className="text-[#020617] text-center font-bold text-base">
                    Enter Sirru
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}


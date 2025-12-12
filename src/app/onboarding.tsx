import React, { useEffect, useRef, useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, Animated, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useUserStore } from "@/stores/user-store";
import { useCheckinStore } from "@/stores/checkin-store";

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

export default function BeginningScreen() {
  const setProfile = useUserStore((s) => s.setProfile);
  const addCheckin = useCheckinStore((s) => s.addCheckin);
  const [showForm, setShowForm] = useState(false);

  // Animation refs
  const bgAnim = useRef(new Animated.Value(0)).current; // 0 = white, 1 = teal, 2 = dark
  const seaLevel = useRef(new Animated.Value(0)).current; // 0 -> 1 height
  const bismillahOpacity = useRef(new Animated.Value(0)).current;
  const bismillahTranslateY = useRef(new Animated.Value(0)).current;

  // Form state
  const [nickname, setNickname] = useState("");
  const [atoll, setAtoll] = useState("");
  const [mood, setMood] = useState<"sunny" | "stormy" | null>(null);
  const [showAtollPicker, setShowAtollPicker] = useState(false);

  const canContinue = useMemo(() => nickname.trim().length > 1 && atoll.length > 0 && mood !== null, [nickname, atoll, mood]);

  useEffect(() => {
    Animated.sequence([
      // Phase 1: Fade in Bismillah + transition to teal
      Animated.parallel([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(bismillahOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Sea rises + background darkens + Bismillah fades out and moves up
      Animated.parallel([
        Animated.timing(seaLevel, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(bgAnim, {
          toValue: 2,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(bismillahOpacity, {
          toValue: 0,
          delay: 1000,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bismillahTranslateY, {
          toValue: -50,
          delay: 1000,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => setShowForm(true));
  }, []);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["#ffffff", "#008B8B", "#020617"], // white → teal → almost black
  });

  const seaHeight = seaLevel.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  function handleContinue() {
    if (!canContinue) return;
    setProfile(nickname.trim(), atoll);
    if (mood) {
      addCheckin(mood);
    }
    router.replace("/onboarding-done");
  }

  const selectedAtoll = atolls.find((a) => a.code === atoll);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      className="flex-1"
    >
      <Animated.View style={{ flex: 1, backgroundColor: bgColor }}>
        {/* Rising sea layer */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: seaHeight,
            backgroundColor: "#008B8B",
          }}
        />

        {/* Centered Bismillah during intro */}
        <Animated.View
          style={{
            position: "absolute",
            top: "40%",
            left: 0,
            right: 0,
            alignItems: "center",
            opacity: bismillahOpacity,
            transform: [{ translateY: bismillahTranslateY }],
          }}
        >
          <Text style={{ color: "white", fontSize: 24, fontWeight: "500" }}>
            بسم الله الرحمن الرحيم
          </Text>
        </Animated.View>

        {/* Form appears after animation */}
        {showForm && (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: "center" }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-6">
              <Text className="text-white text-3xl font-bold text-center mb-2">Sirru</Text>
              <Text className="text-gray-400 text-center">No names. No judgment. Just you.</Text>
            </View>

            {/* Nickname Input */}
            <View className="mb-4">
              <Text className="text-white text-base font-semibold mb-2">Pick a nickname</Text>
              <TextInput
                placeholder="Anything you like"
                placeholderTextColor="#6b7280"
                value={nickname}
                onChangeText={setNickname}
                className="bg-white/10 text-white rounded-2xl px-4 py-3 border border-white/20"
                style={{ color: "#ffffff" }}
              />
            </View>

            {/* Atoll Selector */}
            <View className="mb-4">
              <Text className="text-white text-base font-semibold mb-2">Which atoll are you in?</Text>
              <TouchableOpacity
                onPress={() => setShowAtollPicker(!showAtollPicker)}
                className={`bg-white/10 rounded-2xl px-4 py-3 border ${
                  atoll ? "border-white/20" : "border-white/10"
                }`}
              >
                <Text className="text-white" style={{ color: atoll ? "#ffffff" : "#6b7280" }}>
                  {selectedAtoll ? selectedAtoll.name : "Select your atoll"}
                </Text>
              </TouchableOpacity>

              {showAtollPicker && (
                <View className="mt-2 max-h-64 bg-white/5 rounded-2xl border border-white/10 p-2">
                  <ScrollView nestedScrollEnabled>
                    {atolls.map((item) => (
                      <TouchableOpacity
                        key={item.code}
                        onPress={() => {
                          setAtoll(item.code);
                          setShowAtollPicker(false);
                        }}
                        className={`py-3 px-3 rounded-xl mb-1 ${
                          atoll === item.code
                            ? "bg-[#00FFE0]/20 border border-[#00FFE0]"
                            : "bg-transparent"
                        }`}
                      >
                        <Text className="text-white font-semibold">{item.name}</Text>
                        <Text className="text-gray-400 text-xs">{item.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Mood Selection */}
            <View className="mb-6">
              <Text className="text-white text-base font-semibold mb-2">How is your weather?</Text>
              <View className="flex-row gap-3">
                {(["sunny", "stormy"] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMood(m)}
                    className={`flex-1 rounded-full py-3 px-4 border ${
                      mood === m
                        ? m === "sunny"
                          ? "bg-[#FFD93D] border-[#FFD93D]"
                          : "bg-[#6366F1] border-[#6366F1]"
                        : "bg-white/10 border-white/20"
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        mood === m ? "text-[#020617]" : "text-white"
                      }`}
                    >
                      {m === "sunny" ? "☀️ Sunny" : "⛈️ Stormy"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handleContinue}
              disabled={!canContinue}
              className={`rounded-full py-3 ${
                canContinue ? "bg-[#00FFE0]" : "bg-gray-700"
              }`}
            >
              <Text className="text-[#020617] text-center font-bold text-base">
                Enter Sirru
              </Text>
            </TouchableOpacity>

            <Text className="text-gray-500 text-xs text-center mt-4">
              Anonymous by design. We only store nickname + atoll on device.
            </Text>
          </ScrollView>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

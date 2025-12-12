import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput } from "react-native";
import { router } from "expo-router";
import { useCheckinStore, Mood } from "@/stores/checkin-store";
import { useUserStore } from "@/stores/user-store";
import { computeRoomKey } from "@/lib/faru-room-key";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function CheckinModal({ visible, onClose }: Props) {
  const { addCheckin } = useCheckinStore();
  const profile = useUserStore((s) => s.profile);
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showFaruPrompt, setShowFaruPrompt] = useState(false);

  const handleSubmit = () => {
    if (!mood) return;
    addCheckin(mood, note.trim() || undefined);
    setSubmitted(true);
    
    // If stormy and user has profile, show Faru prompt after a brief delay
    if (mood === "stormy" && profile?.atoll) {
      setTimeout(() => {
        setShowFaruPrompt(true);
      }, 800);
    } else {
      // For sunny or no profile, just close normally
      setTimeout(() => {
        setMood(null);
        setNote("");
        setSubmitted(false);
        setShowFaruPrompt(false);
        onClose();
      }, 700);
    }
  };

  const handleJoinFaru = () => {
    if (!profile?.atoll) return;
    const roomKey = computeRoomKey(profile.atoll);
    setMood(null);
    setNote("");
    setSubmitted(false);
    setShowFaruPrompt(false);
    onClose();
    router.push(`/(app)/faru?roomKey=${encodeURIComponent(roomKey)}`);
  };

  const handleNotNow = () => {
    setMood(null);
    setNote("");
    setSubmitted(false);
    setShowFaruPrompt(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-end">
        {showFaruPrompt ? (
          <View className="w-full bg-[#1E1E1E] rounded-t-3xl p-4 border border-white/10">
            <View className="h-1 w-12 bg-white/20 self-center rounded-full mb-3" />
            <Text className="text-white text-xl font-semibold mb-2">Join Faru?</Text>
            <Text className="text-gray-400 mb-4">
              Join Faru for 30 minutes? Others are riding out the storm too.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleNotNow}
                className="flex-1 border border-gray-600 rounded-full py-3"
              >
                <Text className="text-gray-300 text-center font-semibold">Not now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleJoinFaru}
                className="flex-1 bg-[#00FFE0] rounded-full py-3"
              >
                <Text className="text-[#020617] text-center font-bold">Join Faru</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="w-full bg-[#1E1E1E] rounded-t-3xl p-4 border border-white/10">
            <View className="h-1 w-12 bg-white/20 self-center rounded-full mb-3" />
            <Text className="text-white text-xl font-semibold mb-2">How's your weather?</Text>
            <Text className="text-gray-400 mb-4">Check in anonymously. Pulses stay for 24 hours.</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 rounded-2xl p-4 border ${mood === "sunny" ? "border-[#FFD93D]" : "border-white/10"}`}
                onPress={() => setMood("sunny")}
              >
                <Text className="text-lg">☀️ Sunny</Text>
                <Text className="text-gray-400 text-sm">Doing okay today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-2xl p-4 border ${mood === "stormy" ? "border-[#6366F1]" : "border-white/10"}`}
                onPress={() => setMood("stormy")}
              >
                <Text className="text-lg">⛈️ Stormy</Text>
                <Text className="text-gray-400 text-sm">Riding out a storm</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-300 mt-4 mb-1">Optional note (kept on device)</Text>
            <TextInput
              placeholder="Anything you want to add..."
              placeholderTextColor="#6b7280"
              value={note}
              onChangeText={setNote}
              className="bg-[#121212] text-white rounded-2xl px-4 py-3 border border-white/10"
              multiline
            />
            <TouchableOpacity
              disabled={!mood}
              onPress={handleSubmit}
              className={`mt-4 rounded-full py-3 ${mood ? "bg-[#00FFE0]" : "bg-gray-600"}`}
            >
              <Text className="text-black text-center font-semibold">
                {submitted ? "Pulse added" : "Add my pulse"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} className="mt-2 py-2">
              <Text className="text-gray-400 text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}


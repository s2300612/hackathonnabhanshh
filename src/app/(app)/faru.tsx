import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity } from "react-native";
import { makeId } from "@/lib/make-id";
import { useUserStore } from "@/stores/user-store";

type ChatMessage = { id: string; sender: string; text: string };

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

export default function FaruScreen() {
  const profile = useUserStore((s) => s.profile);
  const creature = useMemo(() => pickCreature(profile?.deviceId ?? makeId()), [profile]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "hi", sender: "Koamas", text: "Hey everyone. Safe space, no names, no judgment. What's your storm tonight?" },
  ]);
  const [input, setInput] = useState("");
  const [minutesLeft, setMinutesLeft] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => setMinutesLeft((m) => Math.max(0, m - 1)), 60000);
    return () => clearInterval(interval);
  }, []);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: makeId(), sender: `${creature.emoji} ${creature.name}`, text: trimmed },
    ]);
    setInput("");
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <View className="px-4 pt-12 pb-4">
        <Text className="text-white text-2xl font-bold">Faru (The Reef)</Text>
        <Text className="text-gray-400">
          Temporary anonymous group space. Auto-closes after 30 minutes. You are {creature.emoji} {creature.name}.
        </Text>
        <Text className="text-gray-400 mt-2">Time left: {minutesLeft} min</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 py-2">
            <Text className="text-gray-400 text-xs mb-1">{item.sender}</Text>
            <View className="bg-[#1E1E1E] border border-white/10 rounded-2xl px-4 py-3">
              <Text className="text-white">{item.text}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 90 }}
      />
      <View className="absolute bottom-0 left-0 right-0 px-3 pb-6 bg-[#121212]">
        <View className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-3">
          <Text className="text-gray-400 text-xs mb-2">
            Rules: disappears in 30 minutes · no names · be kind · no screenshots.
          </Text>
          <View className="flex-row items-center">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Share your storm..."
              placeholderTextColor="#6b7280"
              className="flex-1 text-white px-2 py-2"
              multiline
            />
            <TouchableOpacity
              onPress={send}
              className="bg-[#00FFE0] rounded-full px-4 py-2 ml-2"
            >
              <Text className="text-black font-semibold">Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}


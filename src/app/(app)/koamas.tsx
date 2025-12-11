import React, { useMemo, useRef, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity } from "react-native";
import { useUserStore } from "@/stores/user-store";

type Message = { id: string; role: "user" | "koamas"; text: string };

const starter: Message[] = [
  {
    id: "welcome",
    role: "koamas",
    text: "Hey, I'm Koamas. Warm, anonymous, and here 24/7. What's on your mind?",
  },
];

export default function KoamasScreen() {
  const profile = useUserStore((s) => s.profile);
  const [messages, setMessages] = useState<Message[]>(starter);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<Message>>(null);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: `${Date.now()}-u`, role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const response: Message = {
      id: `${Date.now()}-k`,
      role: "koamas",
      text: craftKoamasReply(trimmed, profile?.nickname),
    };
    setTimeout(() => setMessages((prev) => [...prev, response]), 400);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      className={`mb-3 max-w-[85%] rounded-2xl px-4 py-3 ${
        item.role === "user" ? "self-end bg-[#00FFE0]" : "self-start bg-[#1E1E1E] border border-white/10"
      }`}
    >
      <Text className={item.role === "user" ? "text-black" : "text-white"}>{item.text}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <View className="px-4 pt-12 pb-4">
        <Text className="text-white text-2xl font-bold">Koamas</Text>
        <Text className="text-gray-400">
          A warm, culturally-aware friend. Not a therapist. Anonymous and here even at 2am.
        </Text>
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />
      <View className="absolute bottom-0 left-0 right-0 px-3 pb-6 bg-[#121212]">
        <View className="flex-row items-center bg-[#1E1E1E] border border-white/10 rounded-full px-3 py-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Say anything. No judgment."
            placeholderTextColor="#6b7280"
            className="flex-1 text-white px-2 py-1"
            multiline
          />
          <TouchableOpacity
            onPress={() => send(input)}
            className="bg-[#00FFE0] rounded-full px-4 py-2 ml-2"
          >
            <Text className="text-black font-semibold">Send</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 text-xs mt-2">
          If you mention self-harm or danger, Koamas will gently surface crisis resources.
        </Text>
      </View>
    </View>
  );
}

function craftKoamasReply(text: string, nickname?: string) {
  const lower = text.toLowerCase();
  if (lower.includes("alone")) {
    return "That kind of loneliness hits different. I'm here. Want to share what's making it feel that way?";
  }
  if (lower.includes("sleep")) {
    return "Ugh, those nights are the worst. Mind racing or just can't switch off?";
  }
  if (lower.includes("family") || lower.includes("parents")) {
    return "Family pressure can be heavy, especially here. What happened lately?";
  }
  if (lower.includes("give up") || lower.includes("suicide") || lower.includes("harm")) {
    return "I'm really glad you told me. You deserve real support. Please reach out to the Maldives crisis line if you're in danger. I'm still here with you.";
  }
  return nickname
    ? `Got you, ${nickname}. I'm listening. Want me to just listen or suggest something gentle like the breathing tool?`
    : "I hear you. Want me to just listen or suggest something gentle like the breathing tool?";
}


import React, { useEffect, useMemo, useState, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { makeId } from "@/lib/make-id";
import { useUserStore } from "@/stores/user-store";
import { supabase } from "@/api/supabase";
import { computeRoomKey, getRoomExpiration, parseRoomKey } from "@/lib/faru-room-key";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Message = {
  id: number;
  room_key: string;
  sender_type: "user" | "koamas";
  nickname?: string;
  creature?: string;
  content: string;
  created_at: string;
};

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

// Koamas cooldown: only reply once per 2 minutes per room
const KOAMAS_COOLDOWN_MS = 2 * 60 * 1000;
let lastKoamasReply: Record<string, number> = {};

export default function FaruScreen() {
  const { roomKey: roomKeyParam } = useLocalSearchParams<{ roomKey?: string }>();
  const profile = useUserStore((s) => s.profile);
  const creature = useMemo(() => pickCreature(profile?.deviceId ?? makeId()), [profile]);
  
  // Compute room key: use param if provided, otherwise compute from profile
  const roomKey = useMemo(() => {
    if (roomKeyParam) return roomKeyParam;
    if (profile) return computeRoomKey(profile.atoll);
    return null;
  }, [roomKeyParam, profile]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomExpiresAt, setRoomExpiresAt] = useState<Date | null>(null);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Calculate time left
  useEffect(() => {
    if (!roomExpiresAt) return;
    const updateTime = () => {
      const now = new Date();
      const diff = roomExpiresAt.getTime() - now.getTime();
      const mins = Math.max(0, Math.floor(diff / 60000));
      setMinutesLeft(mins);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [roomExpiresAt]);

  // Upsert room and fetch messages
  useEffect(() => {
    if (!roomKey || !supabase) {
      setLoading(false);
      return;
    }

    const parsed = parseRoomKey(roomKey);
    if (!parsed) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const startsAt = new Date(`${parsed.date}T${parsed.timeWindow.replace("-", ":")}:00`);
    const expiresAt = getRoomExpiration(startsAt);
    setRoomExpiresAt(expiresAt);

    const setupRoom = async () => {
      try {
        // Upsert room
        const { error: roomError } = await supabase
          .from("rooms")
          .upsert(
            {
              room_key: roomKey,
              atoll: parsed.atoll,
              mood: "stormy",
              starts_at: startsAt.toISOString(),
              expires_at: expiresAt.toISOString(),
            },
            { onConflict: "room_key" }
          );

        if (roomError) {
          console.error("Error upserting room:", roomError);
        }

        // Fetch last 50 messages
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .eq("room_key", roomKey)
          .order("created_at", { ascending: true })
          .limit(50);

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
        } else {
          setMessages(messagesData || []);
        }

        // Subscribe to realtime inserts
        const channel = supabase
          .channel(`room:${roomKey}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `room_key=eq.${roomKey}`,
            },
            (payload) => {
              const newMessage = payload.new as Message;
              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some((m) => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
              });
            }
          )
          .subscribe();

        channelRef.current = channel;
      } catch (error) {
        console.error("Error setting up room:", error);
      } finally {
        setLoading(false);
      }
    };

    setupRoom();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomKey]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || !roomKey || !supabase || !profile) return;

    const userMessage: Omit<Message, "id" | "created_at"> = {
      room_key: roomKey,
      sender_type: "user",
      nickname: profile.nickname,
      creature: `${creature.emoji} ${creature.name}`,
      content: trimmed,
    };

    try {
      const { data, error } = await supabase.from("messages").insert(userMessage).select().single();

      if (error) {
        console.error("Error sending message:", error);
        return;
      }

      setInput("");

      // Trigger Koamas reply (with cooldown)
      const now = Date.now();
      const lastReply = lastKoamasReply[roomKey] || 0;
      if (now - lastReply > KOAMAS_COOLDOWN_MS) {
        lastKoamasReply[roomKey] = now;
        
        // Call Koamas Edge Function stub
        setTimeout(async () => {
          try {
            const { data: koamasData, error: koamasError } = await supabase.functions.invoke("koamas_reply", {
              body: { roomKey },
            });

            if (koamasError) {
              console.error("Koamas Edge Function error:", koamasError);
              // Fallback: insert placeholder message
              await supabase.from("messages").insert({
                room_key: roomKey,
                sender_type: "koamas",
                content: "You're not alone. I'm here with you.",
              });
            }
          } catch (err) {
            console.error("Error calling Koamas function:", err);
            // Fallback: insert placeholder message
            await supabase.from("messages").insert({
              room_key: roomKey,
              sender_type: "koamas",
              content: "You're not alone. I'm here with you.",
            });
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error in send:", error);
    }
  };

  const formatSender = (msg: Message) => {
    if (msg.sender_type === "koamas") {
      return "🐬 Koamas";
    }
    if (msg.creature) {
      return msg.creature;
    }
    return msg.nickname || "Anonymous";
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#121212] items-center justify-center">
        <ActivityIndicator size="large" color="#00FFE0" />
        <Text className="text-gray-400 mt-4">Loading Faru...</Text>
      </View>
    );
  }

  if (!roomKey) {
    return (
      <View className="flex-1 bg-[#121212] items-center justify-center px-6">
        <Text className="text-white text-lg mb-4">No room available</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-[#00FFE0] rounded-full px-6 py-3">
          <Text className="text-[#020617] font-semibold">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#121212]">
      <View className="px-4 pt-12 pb-4">
        <Text className="text-white text-2xl font-bold">Faru (The Reef)</Text>
        <Text className="text-gray-400">
          Temporary anonymous group space. Auto-closes after 30 minutes. You are {creature.emoji} {creature.name}.
        </Text>
        {minutesLeft !== null && (
          <Text className="text-gray-400 mt-2">Time left: {minutesLeft} min</Text>
        )}
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="px-4 py-2">
            <Text className="text-gray-400 text-xs mb-1">{formatSender(item)}</Text>
            <View className="bg-[#1E1E1E] border border-white/10 rounded-2xl px-4 py-3">
              <Text className="text-white">{item.content}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 90 }}
        ListEmptyComponent={
          <View className="px-4 py-8 items-center">
            <Text className="text-gray-500 text-center">No messages yet. Be the first to share.</Text>
          </View>
        }
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
              disabled={!input.trim()}
              className={`rounded-full px-4 py-2 ml-2 ${input.trim() ? "bg-[#00FFE0]" : "bg-gray-600"}`}
            >
              <Text className="text-black font-semibold">Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

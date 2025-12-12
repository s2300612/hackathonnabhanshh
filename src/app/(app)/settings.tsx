import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { useUserStore } from "@/stores/user-store";

// ⚠️ For a real app, this password and any API keys
// MUST live on the backend, not in the client bundle.
// For hackathon / demo this is okay-ish.
const ADMIN_PASSWORD = "sirru-koamas-admin";

export default function SettingsScreen() {
  const profile = useUserStore((s) => s.profile);
  const koamasConfig = useUserStore((s) => s.koamasConfig);
  const setNickname = useUserStore((s) => s.setNickname);
  const clearAll = useUserStore((s) => s.clearAll);
  const setKoamasConfig = useUserStore((s) => s.setKoamasConfig);

  const [nicknameDraft, setNicknameDraft] = useState(profile?.nickname || "");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [apiBaseUrlDraft, setApiBaseUrlDraft] = useState(koamasConfig.apiBaseUrl);
  const [modelNameDraft, setModelNameDraft] = useState(koamasConfig.modelName);

  function handleSaveNickname() {
    const trimmed = nicknameDraft.trim();
    if (!trimmed) {
      Alert.alert("Error", "Nickname cannot be empty.");
      return;
    }
    setNickname(trimmed);
    Alert.alert("Saved", "Your nickname has been updated.");
  }

  function handleEraseAll() {
    Alert.alert(
      "Erase all data?",
      "This will reset your nickname, atoll and mood on this device. It will not delete anything from Supabase or other users.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase",
          style: "destructive",
          onPress: () => {
            clearAll();
            setNicknameDraft("");
            // Navigate to onboarding to replay the intro animation
            router.replace("/onboarding");
          },
        },
      ]
    );
  }

  function handleUnlockAdmin() {
    if (adminPassword === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setAdminPassword("");
    } else {
      Alert.alert("Access denied", "Wrong password.");
      setAdminPassword("");
    }
  }

  function handleSaveKoamasConfig() {
    const trimmedUrl = apiBaseUrlDraft.trim();
    const trimmedModel = modelNameDraft.trim();
    
    if (!trimmedUrl || !trimmedModel) {
      Alert.alert("Error", "Both API URL and model name are required.");
      return;
    }

    setKoamasConfig({
      apiBaseUrl: trimmedUrl,
      modelName: trimmedModel,
    });

    // Here you could ALSO call a Supabase function or your own backend
    // to persist this config server-side for all users.
    Alert.alert("Saved", "Koamas AI settings updated for this app.");
  }

  return (
    <ScrollView
      className="flex-1 bg-[#121212]"
      contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
    >
      <Text className="text-white text-2xl font-bold mb-6">Settings</Text>

      {/* Nickname */}
      <View className="bg-[#1E1E1E] rounded-2xl p-4 border border-white/10 mb-4">
        <Text className="text-white text-lg font-semibold mb-3">Nickname</Text>
        <Text className="text-gray-400 text-sm mb-2">Current nickname</Text>
        <Text className="text-[#00FFE0] mb-4">
          {profile?.nickname || "Not set yet"}
        </Text>
        <Text className="text-gray-400 text-sm mb-2">Change nickname</Text>
        <TextInput
          value={nicknameDraft}
          onChangeText={setNicknameDraft}
          placeholder="Type a new nickname"
          placeholderTextColor="#6b7280"
          className="bg-[#121212] text-white rounded-xl px-4 py-3 border border-white/10 mb-4"
          style={{ color: "#ffffff" }}
        />
        <TouchableOpacity
          onPress={handleSaveNickname}
          className="bg-[#00FFE0] rounded-full py-3"
        >
          <Text className="text-[#020617] text-center font-bold">Save nickname</Text>
        </TouchableOpacity>
      </View>

      {/* Erase data */}
      <View className="bg-[#1E1E1E] rounded-2xl p-4 border border-white/10 mb-4">
        <Text className="text-white text-lg font-semibold mb-3">Data & Privacy</Text>
        <Text className="text-gray-400 text-sm mb-2">
          Erase all local data on this device
        </Text>
        <Text className="text-gray-500 text-xs mb-4">
          This will clear your nickname, atoll and mood stored on this phone. It will not delete anything from Supabase or other users.
        </Text>
        <TouchableOpacity onPress={handleEraseAll} className="bg-[#EF4444] rounded-full py-3">
          <Text className="text-white text-center font-bold">Erase all data</Text>
        </TouchableOpacity>
      </View>

      {/* Admin area */}
      <View className="bg-[#1E1E1E] rounded-2xl p-4 border border-white/10">
        <Text className="text-white text-lg font-semibold mb-3">Admin Area</Text>
        {!adminUnlocked ? (
          <>
            <Text className="text-gray-500 text-xs mb-3">
              Admins can edit Koamas AI API settings. Enter the admin password to continue.
            </Text>
            <TextInput
              value={adminPassword}
              onChangeText={setAdminPassword}
              secureTextEntry
              placeholder="Admin password"
              placeholderTextColor="#6b7280"
              className="bg-[#121212] text-white rounded-xl px-4 py-3 border border-white/10 mb-4"
              style={{ color: "#ffffff" }}
            />
            <TouchableOpacity
              onPress={handleUnlockAdmin}
              className="border border-gray-600 rounded-full py-3"
            >
              <Text className="text-gray-300 text-center font-semibold">Unlock admin area</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-gray-500 text-xs mb-4">
              Koamas AI configuration for this app build.
            </Text>
            <Text className="text-gray-400 text-sm mb-2">API Base URL</Text>
            <TextInput
              value={apiBaseUrlDraft}
              onChangeText={setApiBaseUrlDraft}
              placeholder="https://your-api.example.com/koamas"
              placeholderTextColor="#6b7280"
              className="bg-[#121212] text-white rounded-xl px-4 py-3 border border-white/10 mb-4"
              style={{ color: "#ffffff" }}
              autoCapitalize="none"
            />
            <Text className="text-gray-400 text-sm mb-2">Model name / profile</Text>
            <TextInput
              value={modelNameDraft}
              onChangeText={setModelNameDraft}
              placeholder="claude-sonnet-4"
              placeholderTextColor="#6b7280"
              className="bg-[#121212] text-white rounded-xl px-4 py-3 border border-white/10 mb-4"
              style={{ color: "#ffffff" }}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={handleSaveKoamasConfig}
              className="bg-[#00FFE0] rounded-full py-3"
            >
              <Text className="text-[#020617] text-center font-bold">Save Koamas settings</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

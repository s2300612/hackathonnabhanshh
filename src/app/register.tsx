import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";
import { useAuth, authStore } from "@/stores/auth-store";

function RegisterImpl() {
  const auth = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Clear error when user types
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (auth.error) auth.clearError();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (auth.error) auth.clearError();
  };

  const isValid = auth.isValidEmail(email) && password.length >= 6 && !auth.loading;

  const handleRegister = async () => {
    try {
      await auth.register(email, password);
      router.replace("/(app)/camera-advanced");
    } catch (e) {
      // Error is set in authStore.error
    }
  };

  const handleGuest = () => {
    // Set a guest session flag (simple bypass for demo)
    // Use runInAction to ensure MobX reactivity
    runInAction(() => {
      authStore.signedIn = true;
      authStore.email = "guest@demo.local";
    });
    router.replace("/(app)/camera-advanced");
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 8 }}>Create account</Text>
          <Text style={{ color: "#666", marginBottom: 24 }}>Sign up to start using the app.</Text>

          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={handleEmailChange}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              backgroundColor: "#fff",
            }}
          />

          <TextInput
            placeholder="Password (min 6 characters)"
            secureTextEntry
            value={password}
            onChangeText={handlePasswordChange}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 12,
              marginBottom: 4,
              backgroundColor: "#fff",
            }}
          />
          {password.length > 0 && password.length < 6 && (
            <Text style={{ color: "#ef4444", marginBottom: 12, fontSize: 12, marginLeft: 4 }}>
              Password must be at least 6 characters
            </Text>
          )}

          {auth.error && (
            <Text style={{ color: "#ef4444", marginBottom: 12, fontSize: 14 }}>{auth.error}</Text>
          )}

          <Pressable
            onPress={handleRegister}
            disabled={!isValid}
            style={{
              backgroundColor: isValid ? "#222" : "#ccc",
              padding: 14,
              borderRadius: 8,
              marginBottom: 16,
              opacity: isValid ? 1 : 0.6,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>
              {auth.loading ? "Creating account..." : "Register"}
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginBottom: 12 }}>
            <Text>Already have an account? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text style={{ color: "#2563eb", fontWeight: "600" }}>Log in</Text>
              </Pressable>
            </Link>
          </View>

          <Pressable
            onPress={handleGuest}
            style={{
              backgroundColor: "#f3f4f6",
              padding: 14,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#d1d5db",
            }}
          >
            <Text style={{ color: "#374151", textAlign: "center", fontWeight: "600" }}>Continue as guest</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default observer(RegisterImpl);

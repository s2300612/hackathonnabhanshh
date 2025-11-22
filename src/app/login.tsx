import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { observer } from "mobx-react-lite";
import { useAuth } from "@/stores/auth-store";

function LoginImpl() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isValid = auth.isValidEmail(email) && password.length >= 6 && !auth.loading;

  const handleLogin = async () => {
    try {
      await auth.login(email, password);
      router.replace("/(app)/camera-advanced");
    } catch (e) {
      // Error is set in authStore.error
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingTop: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 8 }}>Sign in</Text>
          <Text style={{ color: "#666", marginBottom: 24 }}>Access your camera tools and album.</Text>

          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
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
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              backgroundColor: "#fff",
            }}
          />

          {auth.error && (
            <Text style={{ color: "#ef4444", marginBottom: 12, fontSize: 14 }}>{auth.error}</Text>
          )}

          <Pressable
            onPress={handleLogin}
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
              {auth.loading ? "Signing in..." : "Login"}
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
            <Text>Don't have an account? </Text>
            <Link href="/register" asChild>
              <Pressable>
                <Text style={{ color: "#2563eb", fontWeight: "600" }}>Register</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default observer(LoginImpl);

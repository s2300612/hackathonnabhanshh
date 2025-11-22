import React, { useState } from "react";
import { Link, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { View, Text } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin() {
    setError(null);
    // super-basic validation (keep it local; auth flow already exists in app)
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    try {
      setLoading(true);
      // call your existing sign-in flow
      await signIn({ access: "dummy-access", refresh: "dummy-refresh" });
      router.replace("/(app)/camera-advanced");
    } catch (e: any) {
      setError("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <View className="flex-1 bg-white px-5 dark:bg-neutral-950">
        <View className="mt-16">
          <Text className="text-3xl font-bold text-black dark:text-white">
            Sign in
          </Text>
          <Text className="mt-2 text-neutral-600 dark:text-neutral-300">
            Access your camera tools and album.
          </Text>
        </View>

        <View className="mt-8 gap-4">
          <Input
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error ? (
            <Text className="text-red-600">{error}</Text>
          ) : null}
          <Button label="Login" onPress={onLogin} loading={loading} />
        </View>

        <View className="mt-6 flex-row">
          <Text className="text-neutral-600 dark:text-neutral-300">
            Don't have an account?{" "}
          </Text>
          <Link href="/register">
            <Text className="font-semibold text-blue-600 dark:text-blue-400">
              Register
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

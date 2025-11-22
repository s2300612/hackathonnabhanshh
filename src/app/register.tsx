import React, { useState } from "react";
import { Link, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { View, Text } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getItem, setItem } from "@/lib/storage";

type User = { email: string; name: string; password: string };
type UsersMap = Record<string, User>;

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRegister() {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      setLoading(true);
      // Very basic client-side "accounts" just for demo
      const users = (await getItem<UsersMap>("users")) || {};
      if (users[email]) {
        setError("An account with this email already exists.");
        return;
      }
      users[email] = { email, name: "", password };
      await setItem("users", users);

      // Registration successful, redirect to login
      router.replace("/login");
    } catch (e: any) {
      setError("Registration failed. Please try again.");
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
            Create account
          </Text>
          <Text className="mt-2 text-neutral-600 dark:text-neutral-300">
            Set up your profile to continue.
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
          {error ? <Text className="text-red-600">{error}</Text> : null}
          <Button label="Register" onPress={onRegister} loading={loading} />
        </View>

        <View className="mt-6 flex-row">
          <Text className="text-neutral-600 dark:text-neutral-300">
            Already have an account?{" "}
          </Text>
          <Link href="/login">
            <Text className="font-semibold text-blue-600 dark:text-blue-400">
              Log in
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

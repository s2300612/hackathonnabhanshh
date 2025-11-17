// app/register.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/lib/auth";
import { getItem, setItem } from "@/lib/storage";

type User = { email: string; name: string; password: string };
type UsersMap = Record<string, User>;

export default function Register() {
  const { signIn } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onRegister() {
    // Very basic client-side "accounts" just for demo
    const users = (await getItem<UsersMap>("users")) || {};
    if (users[email]) {
      alert("An account with this email already exists.");
      return;
    }
    users[email] = { email, name, password };
    await setItem("users", users);

    // Normally you'd call your API → receive tokens
    await signIn({ access: "dummy-access", refresh: "dummy-refresh" });
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0b0f13", padding: 16, gap: 12 }}>
      <Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>Create account</Text>

      <TextInput
        placeholder="Full name"
        placeholderTextColor="#9fb1c7"
        value={name}
        onChangeText={setName}
        style={inputStyle}
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#9fb1c7"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={inputStyle}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#9fb1c7"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={inputStyle}
      />

      <Pressable
        onPress={onRegister}
        style={{ backgroundColor: "#2b89ff", padding: 12, borderRadius: 10, alignItems: "center" }}
      >
        <Text style={{ color: "white", fontWeight: "800" }}>Register</Text>
      </Pressable>

      <Link href="/login" style={{ color: "#9fb1c7", textAlign: "center", marginTop: 8 }}>
        Already have an account? Log in
      </Link>
    </View>
  );
}

const inputStyle = {
  backgroundColor: "#1d2733",
  color: "white",
  padding: 12,
  borderRadius: 10,
} as const;

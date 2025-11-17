// app/login.tsx
import React from "react";
import { Link } from "expo-router";

import type { LoginFormProps } from "@/components/login-form";
import { LoginForm } from "@/components/login-form";
import { FocusAwareStatusBar } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const { signIn } = useAuth();               // <-- use the context’s signIn

  const onSubmit: LoginFormProps["onSubmit"] = async (data) => {
    console.log("login submit", data);
    // TODO: call your API & validate; for now set dummy tokens:
    await signIn({ access: "dummy-access", refresh: "dummy-refresh" });
   
  };

  return (
    <>
      <FocusAwareStatusBar />
      <LoginForm onSubmit={onSubmit} />

      {/* Register CTA */}
      <Link
        href="/register"
        style={{ marginTop: 16, textAlign: "center", color: "#2b89ff", fontWeight: "700" }}
      >
        No account? Register here
      </Link>
    </>
  );
}

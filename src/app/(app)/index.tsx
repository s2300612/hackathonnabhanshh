import { useEffect } from "react";
import { router } from "expo-router";
import { useUserStore } from "@/stores/user-store";

export default function IndexRedirect() {
  const hydrated = useUserStore((s) => s.hydrated);
  const profile = useUserStore((s) => s.profile);
  useEffect(() => {
    if (!hydrated) return;
    router.replace(profile ? "/(app)/home" : "/onboarding");
  }, [hydrated, profile]);
  return null;
}

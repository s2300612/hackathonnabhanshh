import { useEffect } from "react";
import { router } from "expo-router";

export default function AppIndexRedirect() {
  useEffect(() => {
    // If someone navigates directly to (app)/index, redirect to home
    router.replace("/(app)/home");
  }, []);
  return null;
}

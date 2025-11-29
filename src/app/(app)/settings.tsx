import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { Button } from "@/components/ui/button";
import { STORAGE_CAMERA_PREFS } from "@/lib/camera-permissions";
import { TINT_SWATCHES } from "@/lib/tint";
import { observer } from "mobx-react-lite";
import { useAuth } from "@/stores/auth-store";
import { useRouter } from "expo-router";
import { useStores } from "@/stores";

type Look = "none" | "night" | "thermal" | "tint";
type Prefs = { defaultLook: Look; defaultTint: string };

const DEFAULTS: Prefs = { defaultLook: "none", defaultTint: TINT_SWATCHES[0] };

export default observer(function SettingsScreen() {
  const auth = useAuth();
  const router = useRouter();
  const { camera } = useStores();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_CAMERA_PREFS);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPrefs({ ...DEFAULTS, ...parsed });
        // defaults hydrated from settings - apply to camera store
        if (parsed.defaultLook) camera.setLook(parsed.defaultLook);
        if (parsed.defaultTint) camera.setTint(parsed.defaultTint);
        // Camera store values are already persisted via makePersistable, so they should be loaded
        // But we can sync from AsyncStorage if needed
        if (parsed.tintAlpha != null) camera.setTintAlpha(parsed.tintAlpha);
        if (parsed.nightAlpha != null) camera.setNight(parsed.nightAlpha);
        if (parsed.thermalAlpha != null) camera.setThermal(parsed.thermalAlpha);
      }
    })();
  }, []);

  const save = async (showFeedback = true) => {
    setSaving(true);
    // Write to AsyncStorage for compatibility, but camera store is the source of truth
    await AsyncStorage.setItem(
      STORAGE_CAMERA_PREFS,
      JSON.stringify({
        ...prefs,
        tintAlpha: camera.tintAlpha,
        nightAlpha: camera.night,
        thermalAlpha: camera.thermal,
      })
    );
    setSaving(false);
    if (showFeedback) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1200);
    }
  };

  const handleSignOut = async () => {
    await auth.logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>Camera Settings</Text>

      <Text style={{ fontWeight: "600" }}>Default Look</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["none", "night", "thermal", "tint"] as Look[]).map((l) => (
          <Button
            key={l}
            label={l}
            size="sm"
            variant={prefs.defaultLook === l ? "default" : "outline"}
            onPress={() => {
              setPrefs((p) => ({ ...p, defaultLook: l }));
              save(true);
            }}
            fullWidth={false}
          />
        ))}
      </View>

      <Text style={{ fontWeight: "600" }}>Default Tint</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {TINT_SWATCHES.map((c) => (
          <Button
            key={c}
            onPress={() => {
              setPrefs((p) => ({ ...p, defaultTint: c }));
              save(true);
            }}
            size="sm"
            fullWidth={false}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: c,
                borderWidth: 1,
                borderColor: "#ddd",
              }}
            />
          </Button>
        ))}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <Text style={{ fontWeight: "700" }}>Tint strength: {Math.round(camera.tintAlpha * 100)}%</Text>
        {showSaved && <Text style={{ color: "#10b981", fontSize: 12 }}>Saved ✓</Text>}
      </View>
      <Slider
        value={camera.tintAlpha}
        onValueChange={(v) => {
          camera.setTintAlpha(v); // Update camera store directly
          save(false); // Auto-save without feedback on drag
        }}
        onSlidingComplete={() => {
          save(true); // Show feedback on release
        }}
        minimumValue={0}
        maximumValue={1}
        step={0.05}
      />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <Text style={{ fontWeight: "700" }}>Night strength: {Math.round(camera.night * 100)}%</Text>
        {showSaved && <Text style={{ color: "#10b981", fontSize: 12 }}>Saved ✓</Text>}
      </View>
      <Slider
        value={camera.night}
        onValueChange={(v) => {
          camera.setNight(v); // Update camera store directly
          save(false);
        }}
        onSlidingComplete={() => {
          save(true);
        }}
        minimumValue={0}
        maximumValue={1}
        step={0.05}
      />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <Text style={{ fontWeight: "700" }}>Thermal strength: {Math.round(camera.thermal * 100)}%</Text>
        {showSaved && <Text style={{ color: "#10b981", fontSize: 12 }}>Saved ✓</Text>}
      </View>
      <Slider
        value={camera.thermal}
        onValueChange={(v) => {
          camera.setThermal(v); // Update camera store directly
          save(false);
        }}
        onSlidingComplete={() => {
          save(true);
        }}
        minimumValue={0}
        maximumValue={1}
        step={0.05}
      />

      <Button label={saving ? "Saving…" : "Save"} onPress={save} disabled={saving} />

      <View style={{ marginTop: 24, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Account</Text>
        <Text style={{ marginBottom: 8 }}>Signed in: {auth.signedIn ? "Yes" : "No"}</Text>
        {auth.signedIn && (
          <Button
            label="Sign out"
            onPress={handleSignOut}
            variant="outline"
          />
          )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
});

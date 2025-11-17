import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { Button } from "@/components/ui/button";
import { STORAGE_CAMERA_PREFS } from "@/lib/camera-permissions";
import { TINT_SWATCHES } from "@/lib/tint";
import { useAuth } from "@/lib/auth";

type Look = "none" | "night" | "thermal" | "tint";
type Prefs = { defaultLook: Look; defaultTint: string };

const DEFAULTS: Prefs = { defaultLook: "none", defaultTint: TINT_SWATCHES[0] };

export default function CameraSettings() {
  const { signOut, token } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [tintAlpha, setTintAlpha] = useState(0.3);
  const [nightAlpha, setNightAlpha] = useState(0.35);
  const [thermalAlpha, setThermalAlpha] = useState(0.45);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_CAMERA_PREFS);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPrefs({ ...DEFAULTS, ...parsed });
        if (parsed.tintAlpha != null) setTintAlpha(parsed.tintAlpha);
        if (parsed.nightAlpha != null) setNightAlpha(parsed.nightAlpha);
        if (parsed.thermalAlpha != null) setThermalAlpha(parsed.thermalAlpha);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    await AsyncStorage.setItem(
      STORAGE_CAMERA_PREFS,
      JSON.stringify({
        ...prefs,
        tintAlpha,
        nightAlpha,
        thermalAlpha,
      })
    );
    setSaving(false);
  };

  return (
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
            onPress={() => setPrefs((p) => ({ ...p, defaultLook: l }))}
            fullWidth={false}
          />
        ))}
      </View>

      <Text style={{ fontWeight: "600" }}>Default Tint</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {TINT_SWATCHES.map((c) => (
          <Button key={c} onPress={() => setPrefs((p) => ({ ...p, defaultTint: c }))} size="sm" fullWidth={false}>
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

      <Text style={{ fontWeight: "700", marginTop: 12 }}>Tint strength</Text>
      <Slider
        value={tintAlpha}
        onValueChange={setTintAlpha}
        onSlidingComplete={() => {
          save();
        }}
        minimumValue={0}
        maximumValue={1}
        step={0.05}
      />

      <Text style={{ fontWeight: "700", marginTop: 12 }}>Night strength</Text>
      <Slider
        value={nightAlpha}
        onValueChange={setNightAlpha}
        onSlidingComplete={() => {
          save();
        }}
        minimumValue={0}
        maximumValue={1}
        step={0.05}
      />

      <Text style={{ fontWeight: "700", marginTop: 12 }}>Thermal strength</Text>
      <Slider
        value={thermalAlpha}
        onValueChange={setThermalAlpha}
        onSlidingComplete={() => {
          save();
        }}
        minimumValue={0}
        maximumValue={1}
        step={0.05}
      />

      <Button label={saving ? "Saving…" : "Save"} onPress={save} disabled={saving} />

      <View style={{ marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: "#e5e7eb", gap: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>Account</Text>
        <Text>Signed in: {token ? "Yes" : "No"}</Text>
        <Pressable
          onPress={signOut}
          style={{ padding: 12, borderRadius: 10, backgroundColor: "#e53935", alignSelf: "flex-start" }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}


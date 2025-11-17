import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Alert, ScrollView, Pressable, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "@/components/ui/button";
import { useFocusEffect, useRouter } from "expo-router";
import { TINT_SWATCHES, Hex, hexToRgba } from "@/lib/tint";
import { STORAGE_CAMERA_PREFS } from "@/lib/camera-permissions";

type Look = "none" | "night" | "thermal" | "tint";

export default function CameraAdvanced() {
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const router = useRouter();

  const [type, setType] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const [look, setLook] = useState<Look>("none");
  const [tint, setTint] = useState<Hex>("#22c55e" as Hex);
  const [tintAlpha, setTintAlpha] = useState<number>(0.3);
  const [nightAlpha, setNightAlpha] = useState<number>(0.35);
  const [thermalAlpha, setThermalAlpha] = useState<number>(0.45);

  const camRef = useRef<CameraView | null>(null);

  const hydratePrefs = useCallback(async () => {
    const prefs = await AsyncStorage.getItem(STORAGE_CAMERA_PREFS);
    if (prefs) {
      const p = JSON.parse(prefs);
      if (p.defaultLook) setLook(p.defaultLook);
      if (p.defaultTint) setTint(p.defaultTint as Hex);
      if (p.tintAlpha != null) setTintAlpha(p.tintAlpha);
      if (p.nightAlpha != null) setNightAlpha(p.nightAlpha);
      if (p.thermalAlpha != null) setThermalAlpha(p.thermalAlpha);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await hydratePrefs();
      if (!camPerm?.granted) await requestCamPerm();
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      hydratePrefs();
    }, [hydratePrefs])
  );

  const cycleFlash = () => {
    setFlash((prev) => (prev === "off" ? "on" : prev === "on" ? "auto" : "off"));
  };

  const takePhoto = useCallback(async () => {
    if (!camRef.current) return;
    try {
      const pic = await camRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
      if (!pic?.uri) return;
      router.push({ pathname: "/(app)/photo", params: { uri: pic.uri } });
    } catch (e:any) {
      Alert.alert("Capture error", String(e?.message ?? e));
    }
  }, [router]);

  if (!camPerm) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Checking camera…</Text>
      </View>
    );
  }
  if (!camPerm.granted) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Camera permission required</Text>
        <Button label="Grant Permission" onPress={requestCamPerm} fullWidth={false} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={{ flex: 1 }}>
        <CameraView
          ref={(r) => (camRef.current = r)}
          facing={type}
          flash={flash}
          enableZoomGesture
          style={{ flex: 1 }}
        />
        {look === "tint" && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: hexToRgba(tint, tintAlpha) }]} />
        )}
        {look === "night" && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0, 60, 0, ${nightAlpha})` }]} />
        )}
        {look === "thermal" && (
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(0,0,0,0)", `rgba(255,0,0,${thermalAlpha})`, `rgba(255,255,0,${thermalAlpha})`]}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        <View style={[StyleSheet.absoluteFillObject, { justifyContent: "space-between", padding: 16 }]}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              label={type === "back" ? "Front" : "Back"}
              size="sm"
              onPress={() => setType(type === "back" ? "front" : "back")}
              fullWidth={false}
            />
            <Button
              label={flash === "off" ? "Flash Off" : flash === "on" ? "Flash On" : "Flash Auto"}
              size="sm"
              variant="outline"
              onPress={cycleFlash}
              fullWidth={false}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(["none", "night", "thermal", "tint"] as Look[]).map((l) => (
              <Button
                key={l}
                label={l}
                size="sm"
                variant={look === l ? "default" : "outline"}
                onPress={() => setLook(l)}
                fullWidth={false}
              />
            ))}
            {TINT_SWATCHES.map((c) => {
              const selected = tint === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    setTint(c as Hex);
                    setLook("tint");
                  }}
                  style={{
                    padding: 6,
                    borderRadius: 999,
                    borderWidth: selected ? 3 : 1,
                    borderColor: selected ? "#fff" : "#ccc",
                  }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c }} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <View style={{ padding: 16, flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff" }}>
        <Button label="Album" variant="outline" onPress={() => router.push("/(app)/album")} fullWidth={false} />
        <Button label="Settings" variant="outline" onPress={() => router.push("/(app)/camera-settings")} fullWidth={false} />
      </View>

      <View style={{ position:"absolute", bottom:18, left:0, right:0, alignItems:"center" }}>
        <Pressable
          onPress={takePhoto}
          style={{ width:72, height:72, borderRadius:36, backgroundColor:"#fff", alignItems:"center", justifyContent:"center", elevation:4 }}
        >
          <View style={{ width:58, height:58, borderRadius:29, backgroundColor:"#111" }} />
        </Pressable>
      </View>
    </View>
  );
}


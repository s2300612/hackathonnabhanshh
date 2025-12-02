import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Alert, ScrollView, Pressable, StyleSheet, Linking, Dimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { observer } from "mobx-react-lite";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { TINT_SWATCHES, Hex, hexToRgba } from "@/lib/tint";
import { useStores } from "@/stores";
import * as Haptics from "expo-haptics";
import { pushFallback } from "@/lib/camera-permissions";
import ViewShot, { captureRef } from "react-native-view-shot";
import OffscreenComposer from "@/components/OffscreenComposer";
import { persistTemp } from "@/lib/fs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const HEADER_H = 52;   // white app bar height
const DIVIDER_H = 4;   // dark strip height under the bar

function CameraAdvancedImpl() {
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const handleGrantCamera = useCallback(async () => {
    try {
      const res = await requestCamPerm();
      if (!res.granted && res.canAskAgain === false) {
        Alert.alert("Permission required", "Camera access is blocked. Open system settings to allow it.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings?.() },
        ]);
      }
    } catch (e) {
      Alert.alert("Error", String((e as Error).message ?? e));
    }
  }, [requestCamPerm]);

  useEffect(() => {
    if (camPerm?.status === "undetermined") requestCamPerm();
  }, [camPerm?.status, requestCamPerm]);

  const router = useRouter();
  const { auth, camera } = useStores();

  React.useEffect(() => {
    if (!auth.signedIn) router.replace("/login");
  }, [auth.signedIn, router]);

  const camRef = useRef<CameraView | null>(null);
  const [rawUri, setRawUri] = useState<string | null>(null);
  const rawUriRef = useRef<string | null>(null);
  const bakeRef = useRef<ViewShot | null>(null);
  const readyRef = useRef(false);
  const onComposerReady = () => {
    readyRef.current = true;
  };

  const look = camera.look;
  const tint = camera.tint as Hex;
  const tintAlpha = camera.tintAlpha;
  const nightAlpha = camera.night;
  const thermalAlpha = camera.thermal;

  const [type, setType] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const cycleFlash = () => setFlash((prev) => (prev === "off" ? "on" : prev === "on" ? "auto" : "off"));

  const takePhoto = useCallback(async () => {
    if (!camRef.current) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      const pic = await camRef.current.takePictureAsync({ quality: 0.9, skipProcessing: true });
      if (!pic?.uri) return;

      rawUriRef.current = pic.uri;
      setRawUri(pic.uri);

      // Bake the current look immediately using the offscreen composer
      readyRef.current = false;
      const start = Date.now();
      while (!readyRef.current && Date.now() - start < 3000) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 50));
      }
      
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise(r => setTimeout(r, 200));

      let bakedUri = pic.uri;
      try {
        console.log("[CAMERA] Capturing baked image with look:", look, "tint:", tint, "alpha:", look === "tint" ? tintAlpha : look === "night" ? nightAlpha : look === "thermal" ? thermalAlpha : 0);
        const captured = await captureRef(bakeRef, {
          format: "jpg",
          quality: 0.92,
          result: "tmpfile",
        }).catch((e) => {
          console.warn("[CAMERA] captureRef failed:", e);
          return null;
        });
        if (captured) {
          console.log("[CAMERA] Captured temp file:", captured);
          await new Promise(r => setTimeout(r, 100));
          try {
            bakedUri = await persistTemp(captured);
            console.log("[CAMERA] Persisted baked image to:", bakedUri);
            // Verify the persisted file exists before proceeding
            const { fileExists } = await import('@/lib/fs');
            const exists = await fileExists(bakedUri);
            if (!exists) {
              throw new Error(`Persisted file does not exist: ${bakedUri}`);
            }
          } catch (persistError) {
            console.error("[CAMERA] persistTemp failed:", persistError);
            // If persistence fails, we can't use the temp file (it will be deleted)
            // So we fall back to the raw photo without effects
            console.warn("[CAMERA] Falling back to raw photo without effects");
            bakedUri = pic.uri;
          }
        } else {
          console.warn("[CAMERA] No captured file, using raw photo");
        }
      } catch (e) {
        console.error("[CAMERA] Baking failed:", e);
        bakedUri = pic.uri;
      }
      
      console.log("[CAMERA] Final bakedUri:", bakedUri);

      const shot = await pushFallback({
        uri: pic.uri,
        bakedUri,
        look,
        tint,
        alpha:
          look === "tint" ? tintAlpha :
          look === "night" ? nightAlpha :
          look === "thermal" ? thermalAlpha : undefined,
      });

      router.replace({
        pathname: "/(app)/viewer",
        params: shot?.id ? { id: String(shot.id) } : { uri: bakedUri },
      });
    } catch (e: any) {
      Alert.alert("Capture error", String(e?.message ?? e));
    }
  }, [look, tint, tintAlpha, nightAlpha, thermalAlpha, router]);

  const insets = useSafeAreaInsets();

  if (!camPerm) return <View style={styles.center}><Text>Checking camera…</Text></View>;
  if (!camPerm.granted) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Camera permission required</Text>
        <Pressable onPress={handleGrantCamera} style={styles.grantBtn}><Text style={styles.grantText}>Grant Permission</Text></Pressable>
        {camPerm?.canAskAgain === false && <Text style={{ color: "#ef4444" }}>Permission is blocked. Tap above to open system settings.</Text>}
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#fff" />

      {/* White App Bar */}
      <View style={{ height: HEADER_H, justifyContent: "center", paddingHorizontal: 16, backgroundColor: "#fff" }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#111" }}>Camera+</Text>
      </View>

      {/* Dark divider below the bar */}
      <View style={{ height: DIVIDER_H, backgroundColor: "#0d2a55" }} />

      {/* Camera preview area */}
      <View style={{ flex: 1, backgroundColor: "#0d2a55" }}>
        <CameraView ref={camRef} facing={type} flash={flash} style={{ flex: 1 }} />

        {/* Overlays – keep exactly as you had */}
        {camera.look === "tint" && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: hexToRgba(camera.tint as Hex, camera.tintAlpha) }]} />
        )}
        {camera.look === "night" && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0,60,0,${camera.night})` }]} />
        )}
        {camera.look === "thermal" && (
          <LinearGradient pointerEvents="none" colors={["rgba(0,0,0,0)", `rgba(255,0,0,${camera.thermal})`, `rgba(255,255,0,${camera.thermal})`]} style={StyleSheet.absoluteFillObject} />
        )}

        {/* Top buttons row, just under the divider */}
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: HEADER_H + DIVIDER_H + 8,
            left: 16,
            right: 16,
            flexDirection: "row",
            gap: 10,
          }}
        >
          <Pressable onPress={() => setType(type === "back" ? "front" : "back")} style={topBtnStyle}>
            <Ionicons name={type === "back" ? "camera-reverse-outline" : "camera-outline"} size={18} color="#fff" />
            <Text style={topBtnText}>{type === "back" ? " Front" : " Back"}</Text>
          </Pressable>

          <Pressable onPress={cycleFlash} style={topBtnStyle}>
            <Ionicons name={flash === "off" ? "flash-off-outline" : "flash-outline"} size={18} color="#fff" />
            <Text style={topBtnText}>
              {flash === "off" ? " Flash Off" : flash === "on" ? " Flash On" : " Flash Auto"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ padding: 16, backgroundColor: "#fff", gap: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: "center" }}>
          {(["none", "night", "thermal", "tint"] as const).map((l) => (
            <Button key={l} label={l} size="sm" variant={camera.look === l ? "default" : "outline"} onPress={() => camera.setLook(l)} fullWidth={false} />
          ))}
          {TINT_SWATCHES.map((c) => {
            const selected = camera.tint === c;
            return (
              <Pressable key={c} onPress={() => { camera.setTint(c); camera.setLook("tint"); }}
                style={{ padding: 4, borderRadius: 999, borderWidth: selected ? 2 : 1, borderColor: selected ? "#000" : "#ccc" }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c }} />
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ position: "relative", alignItems: "center", paddingVertical: 8 }}>
          <Pressable onPress={takePhoto}
            style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 4, borderWidth: 4, borderColor: "#000" }}>
            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: "#111" }} />
          </Pressable>
        </View>
      </View>

      {/* Hidden offscreen compositor used to bake the look */}
      <View style={{ position: "absolute", left: -9999, top: -9999 }}>
        <ViewShot
          ref={bakeRef}
          options={{ format: "jpg", quality: 0.92, result: "tmpfile" }}
          style={{
            width: Math.round(Dimensions.get("window").width),
            height: Math.round((Dimensions.get("window").width * 4) / 3),
            backgroundColor: "#000",
          }}
        >
          <OffscreenComposer
            key={rawUri ?? "none"}
            uri={rawUri ?? ""}
            look={look}
            tintHex={tint}
            alpha={
              look === "tint"
                ? tintAlpha
                : look === "night"
                ? nightAlpha
                : look === "thermal"
                ? thermalAlpha
                : 0
            }
            width={Math.round(Dimensions.get("window").width)}
            height={Math.round((Dimensions.get("window").width * 4) / 3)}
            onReady={onComposerReady}
          />
        </ViewShot>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  grantBtn: { backgroundColor: "#000", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8 },
  grantText: { color: "#fff", fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});

const topBtnStyle = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 6,
  backgroundColor: "rgba(0,0,0,0.85)",
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 10,
  borderWidth: 1,          // white border for contrast
  borderColor: "#fff",
  elevation: 3,
  shadowColor: "#000",
  shadowOpacity: 0.25,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
};

const topBtnText = { color: "#fff", fontWeight: "700" as const, fontSize: 14 };

export default observer(CameraAdvancedImpl);

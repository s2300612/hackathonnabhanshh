import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Alert, ScrollView, Pressable, StyleSheet, Linking } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { observer } from "mobx-react-lite";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { TINT_SWATCHES, Hex, hexToRgba } from "@/lib/tint";
import { useStores } from "@/stores";
import { Compositor, CompositorHandle } from "@/lib/Compositor";
import * as Haptics from "expo-haptics";
import { pushFallback } from "@/lib/camera-permissions";

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
    if (camPerm?.status === "undetermined") {
      requestCamPerm();
    }
  }, [camPerm?.status, requestCamPerm]);
  const router = useRouter();
  const { auth, camera } = useStores();
  const compositorRef = useRef<CompositorHandle>(null);

  const look = camera.look;
  const tint = camera.tint as Hex;
  const tintAlpha = camera.tintAlpha;
  const nightAlpha = camera.night;
  const thermalAlpha = camera.thermal;

  React.useEffect(() => {
    if (!auth.signedIn) router.replace("/login");
  }, [auth.signedIn, router]);

  const [type, setType] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");

  const camRef = useRef<CameraView | null>(null);

  const cycleFlash = () => {
    setFlash((prev) => (prev === "off" ? "on" : prev === "on" ? "auto" : "off"));
  };

  const takePhoto = useCallback(async () => {
    if (!camRef.current) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      const pic = await camRef.current.takePictureAsync({ quality: 0.9, skipProcessing: true });
      if (!pic?.uri) return;

      let finalUri = pic.uri;

      if (look !== "none" && compositorRef.current) {
        finalUri = await compositorRef.current.compose({
          uri: pic.uri,
          look,
          tint,
          tintAlpha,
          nightAlpha,
          thermalAlpha,
        });
      }

      await pushFallback(finalUri);
      router.push({ pathname: "/(app)/photo", params: { uri: finalUri } });
    } catch (e: any) {
      Alert.alert("Capture error", String(e?.message ?? e));
    }
  }, [look, tint, tintAlpha, nightAlpha, thermalAlpha, router]);

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
        <Pressable onPress={handleGrantCamera} style={styles.grantBtn}>
          <Text style={styles.grantText}>Grant Permission</Text>
        </Pressable>
        {camPerm?.canAskAgain === false && (
          <Text style={{ color: "#ef4444" }}>Permission is blocked. Tap above to open system settings.</Text>
        )}
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
        {camera.look === "tint" && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: hexToRgba(camera.tint as Hex, camera.tintAlpha) }]} />
        )}
        {camera.look === "night" && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0, 60, 0, ${camera.night})` }]} />
        )}
        {camera.look === "thermal" && (
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(0,0,0,0)", `rgba(255,0,0,${camera.thermal})`, `rgba(255,255,0,${camera.thermal})`]}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        <View style={[StyleSheet.absoluteFillObject, { padding: 16 }]}>
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
              onPress={cycleFlash}
              fullWidth={false}
            />
          </View>
        </View>
      </View>

      <View style={{ padding: 16, backgroundColor: "#fff", gap: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: "center" }}>
          {(["none", "night", "thermal", "tint"] as const).map((l) => (
            <Button
              key={l}
              label={l}
              size="sm"
              variant={camera.look === l ? "default" : "outline"}
              onPress={() => camera.setLook(l)}
              fullWidth={false}
            />
          ))}
          {TINT_SWATCHES.map((c) => {
            const selected = camera.tint === c;
            return (
              <Pressable
                key={c}
                onPress={() => {
                  camera.setTint(c);
                  camera.setLook("tint");
                }}
                style={{
                  padding: 4,
                  borderRadius: 999,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? "#000" : "#ccc",
                }}
              >
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c }} />
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ position: "relative", alignItems: "center", paddingVertical: 8 }}>
          <Pressable
            onPress={takePhoto}
            style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 4, borderWidth: 4, borderColor: "#000" }}
          >
            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: "#111" }} />
          </Pressable>
        </View>
      </View>
      <Compositor ref={compositorRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  grantBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  grantText: { color: "#fff", fontWeight: "600" },
});

export default observer(CameraAdvancedImpl);


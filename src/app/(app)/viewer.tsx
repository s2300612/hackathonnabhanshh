import React, { useState, useRef } from "react";
import { View, StyleSheet, Alert, TouchableOpacity, Text } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useStores } from "@/stores";
import { Image as ExpoImage } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { LinearGradient } from "expo-linear-gradient";
import ViewShot from "react-native-view-shot";
import { hexToRgba, Hex } from "@/lib/tint";

const ViewerScreen = observer(() => {
  const params = useLocalSearchParams<{ id?: string; baked?: string; raw?: string; uri?: string }>();
  const { camera } = useStores();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const imageShotRef = useRef<ViewShot>(null);

  const shot = params.id ? camera.recent.find((s) => String(s.id) === String(params.id)) : undefined;

  const base = shot?.bakedUri ?? shot?.uri ?? (typeof params.uri === "string" ? params.uri : undefined);
  
  // If we're using bakedUri, the effects are already baked in - don't apply overlays
  const isUsingBakedUri = shot?.bakedUri && base === shot.bakedUri;
  
  // Get effect info from shot or use current camera settings (only for display if not baked)
  const look = shot?.look ?? camera.look;
  const tint = (shot?.tint ?? camera.tint) as Hex;
  const tintAlpha = shot?.alpha ?? camera.tintAlpha;
  const nightAlpha = shot?.alpha ?? camera.night;
  const thermalAlpha = shot?.alpha ?? camera.thermal;

  if (!base) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Viewer" }} />
        <Text style={{ color: "#fff" }}>Photo not found.</Text>
        <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={() => router.replace("/(app)/album")}>
          <Text style={styles.btnText}>Back to Album</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDelete = () => {
    if (!shot) return;
    Alert.alert("Delete", "Remove this photo from the app?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { camera.removeShot(shot.id); router.replace("/(app)/album"); } },
    ]);
  };

  const handleEdit = () => {
    const base = shot?.bakedUri ?? shot?.uri ?? (typeof params.uri === 'string' ? params.uri : '');
    router.push({ pathname: '/(app)/photo', params: { sourceUri: base, effect: 'none' }});
  };

  // Viewer routes export through the editor
  const handleExport = () => {
    const base = shot?.bakedUri ?? shot?.uri ?? (typeof params.uri === 'string' ? params.uri : '');
    router.push({ pathname: '/(app)/photo', params: { sourceUri: base, effect: 'none' }});
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Photo Viewer", headerShown: true }} />
      <ViewShot ref={imageShotRef} options={{ format: "jpg", quality: 0.92 }} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <ExpoImage
            source={{ uri: base }}
            style={styles.image}
            contentFit="contain"
            transition={120}
            cachePolicy="none"
            onError={(e) => console.warn("Viewer image error:", e)}
          />
          
          {/* Only apply effects as overlays if the image is NOT baked (raw image) */}
          {!isUsingBakedUri && look === "tint" && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: hexToRgba(tint, tintAlpha) }]} />
          )}
          {!isUsingBakedUri && look === "night" && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0,60,0,${nightAlpha})` }]} />
          )}
          {!isUsingBakedUri && look === "thermal" && (
            <LinearGradient pointerEvents="none" colors={["rgba(0,0,0,0)", `rgba(255,0,0,${thermalAlpha})`, `rgba(255,255,0,${thermalAlpha})`]} style={StyleSheet.absoluteFillObject} />
          )}
        </View>
      </ViewShot>
      <View style={styles.row}>
        <ActionButton label="Back" onPress={() => router.back()} />
        <ActionButton label="Edit" onPress={handleEdit} />
        {/* Export is routed through the editor so it only captures image + overlays */}
        <ActionButton label="Export" onPress={handleExport} disabled={exporting} />
        {shot && <ActionButton label="Delete" danger onPress={handleDelete} />}
      </View>
    </View>
  );
});

function ActionButton({ label, onPress, danger, disabled }: { label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled}
      style={[styles.btn, danger && styles.dangerBtn, disabled && styles.disabledBtn]}
    >
      <Text style={[styles.btnText, disabled && styles.disabledText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", padding: 16 },
  image: { flex: 1, width: "100%" },
  row: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: "rgba(0,0,0,0.7)" },
  btn: { flex: 1, marginHorizontal: 4, paddingVertical: 12, borderRadius: 10, backgroundColor: "#111", alignItems: "center" },
  dangerBtn: { backgroundColor: "#ef4444" },
  disabledBtn: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "600" },
  disabledText: { opacity: 0.6 },
});

export default ViewerScreen;

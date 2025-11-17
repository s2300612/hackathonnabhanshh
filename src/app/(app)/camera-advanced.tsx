import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, Image, Alert, Platform } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  CameraType,
  FlashMode,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { tintToRGBA, TINT_SWATCHES } from "@/lib/tint";

type Shot = { id: string; uri: string };

const ALBUM = "NabhanCamera";
type Look = "none" | "night" | "thermal" | "tint";

export default function CameraAdvanced() {
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [hasMediaPerm, setHasMediaPerm] = useState<boolean | null>(null);
  const [type, setType] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [look, setLook] = useState<Look>("none");
  const [tint, setTint] = useState<string>(TINT_SWATCHES[0]);
  const [saving, setSaving] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);

  const camRef = useRef<CameraView | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === "ios") {
          const media = await MediaLibrary.requestPermissionsAsync();
          const granted = media.status === "granted";
          setHasMediaPerm(granted);
          if (granted) {
            await loadAlbum();
          }
        } else {
          setHasMediaPerm(true);
          await loadAlbum();
        }
      } catch (e) {
        console.warn("Media permission check failed:", e);
        setHasMediaPerm(false);
      }

      if (!camPermission?.granted) {
        await requestCamPermission();
      }
    })();
  }, []);

  const loadAlbum = useCallback(async () => {
    try {
      const album = await MediaLibrary.getAlbumAsync(ALBUM);
      if (!album) {
        setShots([]);
        return;
      }
      const assets = await MediaLibrary.getAssetsAsync({
        album,
        mediaType: ["photo"],
        sortBy: [["creationTime", false]],
        first: 50,
      });
      setShots(assets.assets.map((a) => ({ id: a.id, uri: a.uri })));
    } catch (e) {
      console.warn("loadAlbum failed", e);
    }
  }, []);

  const cycleFlash = () => {
    setFlash((prev) =>
      prev === "off" ? "on" : prev === "on" ? "auto" : "off"
    );
  };

  const takePhoto = useCallback(async () => {
    if (!camRef.current) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const pic = await camRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      if (!pic?.uri) return;

      if (!hasMediaPerm) {
        setShots((prev) => [{ id: pic.uri, uri: pic.uri }, ...prev]);
        Alert.alert(
          "Saved locally",
          "Media permission denied; not saved to gallery."
        );
        return;
      }
      setSaving(true);
      const asset = await MediaLibrary.createAssetAsync(pic.uri);
      let album = await MediaLibrary.getAlbumAsync(ALBUM);
      if (!album) album = await MediaLibrary.createAlbumAsync(ALBUM, asset, false);
      else await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      await loadAlbum();
    } catch (e) {
      Alert.alert("Capture error", String(e));
    } finally {
      setSaving(false);
    }
  }, [hasMediaPerm, loadAlbum]);

  const deleteShot = useCallback(async (id: string) => {
    try {
      if (!id.startsWith("file:")) {
        await MediaLibrary.deleteAssetsAsync([id]);
      }
      setShots((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      Alert.alert("Delete failed", String(e));
    }
  }, []);

  if (!camPermission) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Checking camera…</Text>
      </View>
    );
  }
  if (!camPermission.granted) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          Camera permission required
        </Text>
        <Button label="Grant Permission" onPress={requestCamPermission} fullWidth={false} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Camera preview */}
      <View style={{ aspectRatio: 3 / 4, backgroundColor: "#000" }}>
        <CameraView
          ref={(r) => (camRef.current = r)}
          facing={type}
          flash={flash}
          enableZoomGesture
          style={{ flex: 1 }}
        >
          {/* Overlay pipeline */}
          {look === "night" && (
            <View
              pointerEvents="none"
              style={{ flex: 1, backgroundColor: "rgba(22, 60, 22, 0.25)" }}
            />
          )}
          {look === "thermal" && (
            <LinearGradient
              pointerEvents="none"
              colors={["#1d4ed8", "#22c55e", "#fde047", "#ef4444"]}
              locations={[0, 0.33, 0.66, 1]}
              style={{ flex: 1, opacity: 0.35 }}
            />
          )}
          {look === "tint" && (
            <View
              pointerEvents="none"
              style={{ flex: 1, backgroundColor: tintToRGBA(tint, 0.3) }}
            />
          )}
        </CameraView>
      </View>

      {/* Controls */}
      <View style={{ padding: 12, gap: 10 }}>
        {/* Top row: camera/flash/capture */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            justifyContent: "space-between",
          }}
        >
          <Button
            label={type === "back" ? "Front" : "Back"}
            size="sm"
            onPress={() => setType(type === "back" ? "front" : "back")}
            fullWidth={false}
          />
          <Button
            label={
              flash === "off"
                ? "Flash Off"
                : flash === "on"
                ? "Flash On"
                : "Flash Auto"
            }
            size="sm"
            variant="outline"
            onPress={cycleFlash}
            fullWidth={false}
          />
          <Button
            label={saving ? "Saving…" : "Capture"}
            size="lg"
            onPress={takePhoto}
            disabled={saving}
            fullWidth={false}
          />
        </View>

        {/* Look selector */}
        <View style={{ flexDirection: "row", gap: 8 }}>
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
        </View>

        {/* Tint swatches (visible only in tint mode) */}
        {look === "tint" && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {TINT_SWATCHES.map((c) => (
              <Button
                key={c}
                size="sm"
                onPress={() => setTint(c)}
                fullWidth={false}
                // use children to show a colored chip
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: c,
                  }}
                />
              </Button>
            ))}
          </View>
        )}

        {/* Recent shots */}
        <Text style={{ fontWeight: "600", marginTop: 4 }}>
          Recent (album: {ALBUM})
        </Text>
        <FlatList
          horizontal
          data={shots}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item }) => (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <Image source={{ uri: item.uri }} style={{ width: 120, height: 120 }} />
              <View
                style={{
                  flexDirection: "row",
                  padding: 6,
                  gap: 6,
                  justifyContent: "space-between",
                }}
              >
                <Button
                  label="Delete"
                  size="sm"
                  onPress={() => deleteShot(item.id)}
                  fullWidth={false}
                />
                <Button
                  label="Process"
                  size="sm"
                  variant="outline"
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/process",
                      params: { uri: item.uri },
                    })
                  }
                  fullWidth={false}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={{ opacity: 0.6 }}>No photos yet.</Text>}
          contentContainerStyle={{ paddingVertical: 6 }}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

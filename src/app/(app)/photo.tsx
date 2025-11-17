import React, { useEffect, useMemo, useRef, useState } from "react";

import { View, Text, Image, Pressable, Alert, StyleSheet } from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import { observer } from "mobx-react-lite";

import ViewShot from "react-native-view-shot";

import * as MediaLibrary from "expo-media-library";

import Slider from "@react-native-community/slider";

import { requestMediaPermission, ALBUM } from "@/lib/camera-permissions";

import { useStores } from "@/stores";

import type { Look } from "@/stores/camera-store";



function PhotoEditorImpl() {

  const { uri } = useLocalSearchParams<{ uri: string }>();

  const router = useRouter();

  const { camera } = useStores();



  // Initialize from store, but allow local overrides for this editing session

  const [look, setLook] = useState<Look>(camera.look);

  const [tint, setTint] = useState(camera.tint);

  const [night, setNight] = useState(camera.night);

  const [thermal, setThermal] = useState(camera.thermal);

  const [tintAlpha, setTintAlpha] = useState(camera.tintAlpha);

  const [busy, setBusy] = useState(false);



  // Sync local state when store changes (e.g., from Settings screen)

  useEffect(() => {

    setLook(camera.look);

    setTint(camera.tint);

    setNight(camera.night);

    setThermal(camera.thermal);

    setTintAlpha(camera.tintAlpha);

  }, [camera.look, camera.tint, camera.night, camera.thermal, camera.tintAlpha]);



  const viewRef = useRef<ViewShot>(null);



  const overlay = useMemo(() => {

    if (look === "night") return { backgroundColor: `rgba(0,128,64,${night})` };

    if (look === "thermal") return { backgroundColor: `rgba(255,0,0,${thermal})` };

    if (look === "tint") return { backgroundColor: hexToRgba(tint, tintAlpha) };

    return {};

  }, [look, night, thermal, tint, tintAlpha]);



  const onExport = async () => {

    if (!viewRef.current) return;

    try {

      setBusy(true);

      const tmpPath = await viewRef.current.capture?.({

        format: "jpg",

        quality: 0.92,

        result: "tmpfile",

      });

      if (!tmpPath) throw new Error("Capture failed");



      const perm = await requestMediaPermission();

      if (!perm.canWrite) throw new Error("No Photos/Media write permission");



      const asset = await MediaLibrary.createAssetAsync(tmpPath);

      let album = await MediaLibrary.getAlbumAsync(ALBUM);

      if (!album) album = await MediaLibrary.createAlbumAsync(ALBUM, asset, false);

      else await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);



      Alert.alert("Exported", "A baked copy was saved to your gallery.");

    } catch (e: any) {

      Alert.alert("Export error", String(e?.message ?? e));

    } finally {

      setBusy(false);

    }

  };



  if (!uri) return <Text style={{ padding: 16 }}>No image selected.</Text>;



  return (

    <View style={{ flex: 1, padding: 16 }}>

      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>photo</Text>



      <ViewShot ref={viewRef} style={{ borderRadius: 12, overflow: "hidden" }}>

        <View style={{ width: "100%", aspectRatio: 1, position: "relative" }}>

          <Image source={{ uri: String(uri) }} style={{ width: "100%", height: "100%" }} />

          {look !== "none" && <View style={[StyleSheet.absoluteFill, overlay]} />}

        </View>

      </ViewShot>



      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>

        {(["none", "night", "thermal", "tint"] as Look[]).map((l) => (

          <Pressable

            key={l}

            onPress={() => {

              setLook(l);

              camera.setLook(l);

            }}

            style={{

              paddingVertical: 6,

              paddingHorizontal: 12,

              borderRadius: 8,

              borderWidth: 1,

              backgroundColor: look === l ? "#000" : "#fff",

            }}

          >

            <Text style={{ color: look === l ? "#fff" : "#000" }}>{l}</Text>

          </Pressable>

        ))}

      </View>



      {look === "night" && (

        <>

          <Text style={{ marginTop: 12 }}>Night strength</Text>

          <Slider

            value={night}

            onValueChange={(v) => {

              setNight(v);

              camera.setNight(v);

            }}

            minimumValue={0}

            maximumValue={0.8}

            step={0.02}

          />

        </>

      )}



      {look === "thermal" && (

        <>

          <Text style={{ marginTop: 12 }}>Thermal strength</Text>

          <Slider

            value={thermal}

            onValueChange={(v) => {

              setThermal(v);

              camera.setThermal(v);

            }}

            minimumValue={0}

            maximumValue={0.8}

            step={0.02}

          />

        </>

      )}



      {look === "tint" && (

        <>

          <Text style={{ marginTop: 12 }}>Tint</Text>

          <View style={{ flexDirection: "row", gap: 8, marginVertical: 6 }}>

            {["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#a855f7"].map((c) => (

              <Pressable

                key={c}

                onPress={() => {

                  setTint(c);

                  camera.setTint(c);

                }}

                style={{

                  width: 28,

                  height: 28,

                  borderRadius: 14,

                  backgroundColor: c,

                  borderWidth: tint === c ? 2 : 0,

                }}

              />

            ))}

          </View>

          <Text>Tint strength</Text>

          <Slider

            value={tintAlpha}

            onValueChange={(v) => {

              setTintAlpha(v);

              camera.setTintAlpha(v);

            }}

            minimumValue={0}

            maximumValue={0.8}

            step={0.02}

          />

        </>

      )}



      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>

        <Pressable onPress={() => router.back()} style={btn("outline")}>

          <Text>Back</Text>

        </Pressable>

        <Pressable disabled={busy} onPress={onExport} style={btn("solid")}>

          <Text style={{ color: "#fff" }}>{busy ? "Exporting…" : "Export"}</Text>

        </Pressable>

      </View>

    </View>

  );

}



export default observer(PhotoEditorImpl);



function hexToRgba(hex: string, a = 0.3) {

  const n = hex.replace("#", "");

  const r = parseInt(n.slice(0, 2), 16);

  const g = parseInt(n.slice(2, 4), 16);

  const b = parseInt(n.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${a})`;

}



function btn(kind: "solid" | "outline") {

  return {

    paddingVertical: 10,

    paddingHorizontal: 16,

    borderRadius: 8,

    borderWidth: kind === "outline" ? 1 : 0,

    backgroundColor: kind === "solid" ? "#111" : "transparent",

  };

}

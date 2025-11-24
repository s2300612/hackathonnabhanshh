import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

import { View, Text, Image, Alert, StyleSheet, ScrollView, Pressable } from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import { observer } from "mobx-react-lite";

import ViewShot, { captureRef } from "react-native-view-shot";

import * as MediaLibrary from "expo-media-library";

import Slider from "@react-native-community/slider";

import { Button } from "@/components/ui/button";

import { useStores } from "@/stores";

import { withTimeout } from "@/lib/promise-timeout";

import { getMediaPermission, ALBUM } from "@/lib/camera-permissions";

import { showMessage } from "react-native-flash-message";



// --- Helpers (kept local so nothing odd gets spread into JSX) ---

type Look = "none" | "night" | "thermal" | "tint";



const thermalOverlay = (alpha: number) => ({

  backgroundColor: `rgba(255,0,0,${alpha})`,

});



const nightOverlay = (alpha: number) => ({

  backgroundColor: `rgba(0,255,128,${alpha})`,

});



const tintOverlay = (hex: string, alpha: number) => {

  // simple hex → rgba

  const v = hex.replace("#", "");

  const r = parseInt(v.slice(0, 2), 16);

  const g = parseInt(v.slice(2, 4), 16);

  const b = parseInt(v.slice(4, 6), 16);

  return { backgroundColor: `rgba(${r},${g},${b},${alpha})` };

};



// ----------------------------------------------------------------



function PhotoEditorImpl() {
  const router = useRouter();
  const { auth, history } = useStores();

  React.useEffect(() => {
    if (!auth.signedIn) router.replace("/login");
  }, [auth.signedIn, router]);

  const params = useLocalSearchParams<{
    uri?: string | string[];
    mode?: "edit" | "new";
    sourceUri?: string;
    effect?: Look;
    tintHex?: string;
    strength?: string;
    editId?: string;
    autoExport?: string;
  }>();

  // Resolve URI from params
  const uri = useMemo(() => {
    if (params.sourceUri) return String(params.sourceUri);
    const raw = params.uri;
    return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  }, [params.uri, params.sourceUri]);

  const shotRef = useRef<ViewShot>(null);

  // Initialize state from params if in edit mode, otherwise defaults
  const [look, setLook] = useState<Look>(() => (params.effect as Look) || "none");
  const [tint, setTint] = useState(() => params.tintHex || "#22c55e");
  const [strength, setStrength] = useState(() => {
    if (params.strength) {
      const parsed = parseFloat(params.strength);
      return isNaN(parsed) ? 0.35 : parsed;
    }
    return 0.35;
  });

  const [exporting, setExporting] = useState(false);
  const [editId, setEditId] = useState<string | null>(() => params.editId || null);

  // Create draft entry if not in edit mode (new edit)
  useEffect(() => {
    if (!uri || editId || params.mode === "edit") return; // Skip if already has editId or in edit mode

    const entry = history.addDraft({
      sourceUri: String(uri),
      effect: look,
      tintHex: look === "tint" ? tint : undefined,
      strength: strength,
    });

    setEditId(entry.id);
  }, [uri, editId, params.mode, history, look, tint, strength]);



  const overlayStyle = useMemo(() => {

    if (look === "night") return nightOverlay(strength);

    if (look === "thermal") return thermalOverlay(strength);

    if (look === "tint") return tintOverlay(tint, strength);

    return null;

  }, [look, tint, strength]);



  if (!uri) {

    return (

      <View style={styles.center}>

        <Text>No image received.</Text>

        <Button label="Back" onPress={() => router.replace("/(app)/album")} fullWidth={false} />

      </View>

    );

  }



  const onExport = useCallback(async () => {

    if (exporting || !uri) return;

    setExporting(true);



    try {

      // If we have an editId, update existing entry; otherwise create new draft (re-edit case)
      let currentEditId = editId;
      
      if (!currentEditId) {
        // Re-edit case: create new draft entry
        const entry = history.addDraft({
          sourceUri: String(uri),
          effect: look,
          tintHex: look === "tint" ? tint : undefined,
          strength: strength,
        });
        currentEditId = entry.id;
        setEditId(currentEditId);
      } else {
        // Update existing entry with current settings
        const entry = history.recentEdits.find((e) => e.id === currentEditId);
        if (entry && entry.status === "draft") {
          // Only update if it's still a draft
          entry.effect = look;
          entry.tintHex = look === "tint" ? tint : undefined;
          entry.strength = strength;
          entry.updatedAt = Date.now();
        }
      }



      // capture with timeout guard so it never hangs

      const snapUri = await withTimeout(

        captureRef(shotRef, { format: "jpg", quality: 0.9, result: "tmpfile" }),

        12000,

        "Export took too long"

      );



      // Check permissions before any MediaLibrary calls

      const { canRead, canWrite } = await getMediaPermission();

      // 1) Always call createAssetAsync (requires write permission)

      if (!canWrite) {

        Alert.alert(

          "Photos permission needed",

          "Enable Photos/Media permission to export.",

          [{ text: "OK" }]

        );

        return;

      }

      const asset = await MediaLibrary.createAssetAsync(String(snapUri));



      // 2) Only manage a named album if READ is granted

      if (canRead) {

        let album = await MediaLibrary.getAlbumAsync(ALBUM);

        if (!album) {

          album = await MediaLibrary.createAlbumAsync(ALBUM, asset, false);

        } else {

          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);

        }

      }



      // Mark the entry as exported
      if (currentEditId) {
        history.markExported(currentEditId, asset.uri);
      }

      // Show success message
      const albumMsg = canRead ? ` and added to ${ALBUM} album` : "";
      showMessage({
        message: "Exported successfully",
        description: `Saved to gallery${albumMsg}`,
        type: "success",
        duration: 3000,
      });
      
      // Navigate back after successful export
      router.replace("/(app)/album");

    } catch (e: any) {
      const errorMsg = String(e?.message ?? e);
      showMessage({
        message: "Export failed",
        description: errorMsg,
        type: "danger",
        duration: 4000,
      });
      Alert.alert("Export failed", errorMsg);

    } finally {
      // Always reset exporting state, even if error occurred
      setExporting(false);
    }

  }, [uri, exporting, editId, look, strength, tint, history, router]);

  // Auto-export if requested (only once on mount)
  const autoExportRef = useRef(false);
  useEffect(() => {
    if (params.autoExport === "true" && !autoExportRef.current && !exporting && uri && editId) {
      autoExportRef.current = true;
      // Small delay to ensure UI is ready
      setTimeout(() => {
        onExport();
      }, 500);
    }
  }, [params.autoExport, uri, editId, exporting, onExport]);



  return (

    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>photo</Text>



      <ViewShot ref={shotRef} style={styles.frame} options={{ format: "jpg", quality: 0.95 }}>

        <Image source={{ uri }} style={styles.image} resizeMode="contain" />

        {overlayStyle && <View pointerEvents="none" style={[StyleSheet.absoluteFill, overlayStyle]} />}

      </ViewShot>



      <View style={styles.row}>

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



      {look === "tint" && (

        <View style={styles.row}>

          {["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#a855f7"].map((c) => (

            <Pressable

              key={c}

              onPress={() => setTint(c)}

              style={[

                { width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: tint === c ? 2 : 1, borderColor: tint === c ? "#000" : "#ccc" }

              ]}

            />

          ))}

        </View>

      )}



      {look !== "none" && (

        <View style={{ gap: 8 }}>

          <Text>Strength</Text>

          <Slider

            value={strength}

            onValueChange={setStrength}

            minimumValue={0}

            maximumValue={1}

            step={0.05}

          />

        </View>

      )}



      <View style={styles.row}>

        <Button label="Back" onPress={() => router.replace("/(app)/album")} fullWidth={false} />

        <Button label={exporting ? "Exporting…" : "Export"} onPress={onExport} disabled={exporting} />

      </View>

    </ScrollView>

  );

}



const styles = StyleSheet.create({

  container: { padding: 16, gap: 12 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 12 },

  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },

  frame: { aspectRatio: 3 / 4, borderRadius: 12, overflow: "hidden", backgroundColor: "#111" },

  image: { width: "100%", height: "100%" },

  row: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },

});



export default observer(PhotoEditorImpl);

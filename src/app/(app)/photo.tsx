import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

import {
  View,
  Text,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  InteractionManager,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";

import { observer } from "mobx-react-lite";

import ViewShot, { captureRef } from "react-native-view-shot";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { persistTemp, fileExists, ensureCacheDir } from '@/lib/fs';

import Slider from "@react-native-community/slider";

import { Button } from "@/components/ui/button";

import { useStores } from "@/stores";

import { getMediaPermission } from "@/lib/camera-permissions";

import { showMessage } from "react-native-flash-message";

import { hexToRgba, Hex } from "@/lib/tint";

// --- Helpers (kept local so nothing odd gets spread into JSX) ---

type Look = "none" | "night" | "thermal" | "tint";

const normalizeEffect = (value?: string): Look => {
  if (value === "night" || value === "thermal" || value === "tint") return value;
  return "none";
};



// Thermal overlay removed - using LinearGradient directly in JSX to match Camera



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
    // Saved effect from shot (base layer)
    savedEffect?: Look;
    savedTint?: string;
    savedStrength?: string;
  }>();

  // Resolve URI from params - prioritize sourceUri (from viewer/album)
  const sourceUri = useMemo(() => {
    if (params.sourceUri) return String(params.sourceUri);
    const raw = params.uri;
    return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  }, [params.uri, params.sourceUri]);

  // bakedParam is the same as sourceUri when coming from viewer
  const bakedParam = typeof params.sourceUri === "string" ? params.sourceUri : "";

  const { width: SCREEN_W } = Dimensions.get("window");
  const viewShotRef = useRef<ViewShot>(null);
  const [imgReady, setImgReady] = React.useState(false);
  const editorReadyResolve = React.useRef<null | (() => void)>(null);
  // Ensure dimensions are always valid (minimum screen width and 4:3 aspect ratio)
  const defaultH = Math.round((SCREEN_W * 4) / 3);
  const [imgW, setImgW] = useState<number>(SCREEN_W);
  const [imgH, setImgH] = useState<number>(defaultH);

  // Saved effect from shot (base layer - always shown)
  const savedLook = useMemo(() => normalizeEffect(typeof params.savedEffect === "string" ? params.savedEffect : undefined), [params.savedEffect]);
  const savedTint = useMemo(() => params.savedTint || "#22c55e", [params.savedTint]);
  const savedStrength = useMemo(() => {
    if (params.savedStrength) {
      const parsed = parseFloat(params.savedStrength);
      return isNaN(parsed) ? 0.35 : parsed;
    }
    return 0.35;
  }, [params.savedStrength]);

  // Current effect (can be layered on top of saved effect)
  const [look, setLook] = useState<Look>(() => normalizeEffect(typeof params.effect === "string" ? params.effect : undefined));
  const [tint, setTint] = useState(() => params.tintHex || "#22c55e");
  const [strength, setStrength] = useState(() => {
    if (params.strength) {
      const parsed = parseFloat(params.strength);
      return isNaN(parsed) ? 0.35 : parsed;
    }
    return 0.35;
  });

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<number>(0); // 0-100 percentage
  const [editId, setEditId] = useState<string | null>(() => params.editId || null);

  // Compute baseUri - use sourceUri directly
  // If it's a data URI, use it directly (no file system operations needed)
  // If it's a file URI with encoding, try to convert to data URI to avoid path issues
  const baseUriRaw = String(params.sourceUri || sourceUri || bakedParam || '');
  const [baseUri, setBaseUri] = useState(baseUriRaw);
  
  useEffect(() => {
    // If it's already a data URI, use it directly
    if (baseUriRaw.startsWith('data:')) {
      setBaseUri(baseUriRaw);
      return;
    }
    
    // If it's a file URI with encoding, check if file exists before converting
    if (baseUriRaw.startsWith('file://') && baseUriRaw.includes('%')) {
      console.log("[EDITOR] Checking if encoded file URI exists before converting");
      (async () => {
        try {
          const { fileExists } = await import('@/lib/fs');
          const exists = await fileExists(baseUriRaw);
          if (!exists) {
            console.warn("[EDITOR] File does not exist, cannot convert to data URI:", baseUriRaw);
            // Try to decode the URI and check if that exists
            try {
              const decoded = decodeURIComponent(baseUriRaw);
              const decodedExists = await fileExists(decoded);
              if (decodedExists) {
                console.log("[EDITOR] Decoded URI exists, using decoded version");
                setBaseUri(decoded);
                return;
              }
            } catch (decodeError) {
              console.warn("[EDITOR] Failed to decode URI:", decodeError);
            }
            // If file doesn't exist, just use the original URI and let ExpoImage handle it
            setBaseUri(baseUriRaw);
            return;
          }
          
          // File exists, try to convert to data URI
          console.log("[EDITOR] File exists, converting encoded file URI to data URI");
          const { readAsStringAsync, EncodingType } = await import('expo-file-system/legacy');
          const base64 = await readAsStringAsync(baseUriRaw, { encoding: EncodingType.Base64 });
          const dataUri = `data:image/jpeg;base64,${base64}`;
          console.log("[EDITOR] Successfully converted to data URI");
          setBaseUri(dataUri);
        } catch (e) {
          console.warn("[EDITOR] Failed to convert to data URI, using original:", e);
          setBaseUri(baseUriRaw);
        }
      })();
    } else {
      // No encoding or not a file URI, use as-is
      setBaseUri(baseUriRaw);
    }
  }, [baseUriRaw]);

  function onBaseImageLoad() {
    setImgReady(true);
    if (editorReadyResolve.current) editorReadyResolve.current();
  }

  async function waitEditorReady() {
    // Always resolve within timeout to prevent hanging
    await new Promise<void>((resolve) => {
      if (imgReady) {
        resolve();
        return;
      }
      editorReadyResolve.current = resolve;
      // Hard timeout to prevent infinite waiting
      setTimeout(() => {
        console.warn("[EDITOR] waitEditorReady timeout, proceeding anyway");
        resolve();
      }, 3000);
    });
    // Give time for overlays to render
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(r => setTimeout(r, 150));
  }

  // Compute render size from base image dimensions
  // Don't block image loading - set default dimensions immediately
  useEffect(() => {
    // Set default dimensions immediately so image can start loading
    setImgW(SCREEN_W);
    setImgH(defaultH);
    setImgReady(true); // Allow image to load even if we don't know its size yet
    
    if (typeof baseUri === "string" && baseUri.length > 0) {
      console.log("[EDITOR] Getting image size for:", baseUri);
      // Try to get size, but don't block rendering
      // Use copied URI if available to avoid encoding issues
      Image.getSize(
        baseUri,
        (w, h) => {
          console.log("[EDITOR] Image size:", w, "x", h);
          if (w > 0 && h > 0) {
            const scaledH = Math.round((SCREEN_W * h) / w);
            setImgW(SCREEN_W);
            setImgH(scaledH);
            console.log("[EDITOR] Scaled dimensions:", SCREEN_W, "x", scaledH);
          }
        },
        (error) => {
          console.warn("[EDITOR] Failed to get image size (non-blocking):", error, "URI:", baseUri);
          // Keep default dimensions - image will still load
        }
      );
    } else {
      console.warn("[EDITOR] No baseUri");
    }
  }, [baseUri, SCREEN_W, defaultH]);

  // Create or update draft entry
  useEffect(() => {
    if (!sourceUri) return;

    // If we have an editId, update the existing draft
    if (editId) {
      history.updateDraft(editId, {
        sourceUri: String(sourceUri),
        effect: look,
        tintHex: look === "tint" ? tint : undefined,
        strength: strength,
      });
      return;
    }

    // If we're resuming from history (has editId in params), use that
    if (params.editId) {
      setEditId(params.editId);
      // Update the existing draft with current settings
      history.updateDraft(params.editId, {
        sourceUri: String(sourceUri),
        effect: look,
        tintHex: look === "tint" ? tint : undefined,
        strength: strength,
      });
      return;
    }

    // Create a new draft entry for new edits
    const entry = history.addDraft({
      sourceUri: String(sourceUri),
      effect: look,
      tintHex: look === "tint" ? tint : undefined,
      strength: strength,
    });

    setEditId(entry.id);
  }, [sourceUri, editId, params.editId, history, look, tint, strength]);



  if (!sourceUri) {

    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.center}>

          <Text>No image received.</Text>

          <Button label="Back" onPress={() => router.replace("/(app)/album")} fullWidth={false} />

        </View>
      </SafeAreaView>
    );

  }



  const doExport = useCallback(async () => {
    setExporting(true);
    try {
      // Request permission first
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) {
        setExporting(false);
        Alert.alert("Permission needed", "Enable Photos/Media permission to save.");
        return;
      }

      // For "no edits" case (look === "none" and no saved effect)
      if (look === "none" && savedLook === "none") {
        const { ensureFileUri } = await import("@/lib/ensureFileUri");
        const fileUri = await ensureFileUri(baseUri);
        console.log("[EXPORT]", fileUri);
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        console.log("[EXPORT_OK]", asset.id);
        
        // Mark as exported in history if there's an editId
        if (editId) {
          history.markExported(editId, asset.uri);
        }
        
        Alert.alert("Saved", "Exported to gallery.");
        return;
      }

      // For edited exports, capture with ViewShot
      await waitEditorReady();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise(r => setTimeout(r, 150));

      if (!viewShotRef.current) {
        // Fall back to base file if capture fails
        const { ensureFileUri } = await import("@/lib/ensureFileUri");
        const fileUri = await ensureFileUri(baseUri);
        console.log("[EXPORT]", fileUri);
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        console.log("[EXPORT_OK]", asset.id);
        
        // Mark as exported in history if there's an editId
        if (editId) {
          history.markExported(editId, asset.uri);
        }
        
        Alert.alert("Saved", "Exported to gallery.");
        return;
      }

      // Capture with tmpfile result
      const captured = await captureRef(viewShotRef, {
        format: "jpg",
        quality: 0.92,
        result: "tmpfile"
      }).catch((e) => {
        console.warn("[EDITOR] captureRef error:", e);
        return null;
      });

      if (!captured) {
        // Fall back to base file if capture fails
        const { ensureFileUri } = await import("@/lib/ensureFileUri");
        const fileUri = await ensureFileUri(baseUri);
        console.log("[EXPORT]", fileUri);
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        console.log("[EXPORT_OK]", asset.id);
        
        // Mark as exported in history if there's an editId
        if (editId) {
          history.markExported(editId, asset.uri);
        }
        
        Alert.alert("Saved", "Exported to gallery.");
        return;
      }

      // Ensure captured file is a file:// URI
      const { ensureFileUri } = await import("@/lib/ensureFileUri");
      const fileUri = await ensureFileUri(captured);
      console.log("[EXPORT]", fileUri);
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      console.log("[EXPORT_OK]", asset.id);
      
      // Mark as exported in history if there's an editId
      if (editId) {
        history.markExported(editId, asset.uri);
      }
      
      Alert.alert("Saved", "Exported to gallery.");
    } catch (e) {
      console.warn("[EXPORT_ERR]", e);
      Alert.alert("Export failed", String(e instanceof Error ? e.message : e));
    } finally {
      setExporting(false);
    }
  }, [baseUri, look, savedLook, waitEditorReady, viewShotRef, editId, history]);


  // Auto-export if requested (only once on mount)
  const autoExportRef = useRef(false);
  useEffect(() => {
    const baseUri = bakedParam || sourceUri;
    if (
      params.autoExport === "true" &&
      !autoExportRef.current &&
      !exporting &&
      baseUri &&
      imgReady
    ) {
      autoExportRef.current = true;
      doExport();
    }
  }, [params.autoExport, bakedParam, sourceUri, exporting, imgReady, doExport]);



  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.title}>photo</Text>

        {/* Visible preview - image with overlays - wrapped in ViewShot for capture */}
        <ViewShot 
          ref={viewShotRef} 
          options={{ format: "jpg", quality: 0.85 }} 
          style={{ 
            width: "100%", 
            aspectRatio: (imgW && imgH && imgW > 0 && imgH > 0) ? imgW / imgH : 3 / 4, 
            backgroundColor: "#000", 
            marginVertical: 12, 
            minHeight: 200, 
            position: "relative", 
            overflow: "hidden" 
          }}
        >
          {baseUri ? (
            <>
              <ExpoImage
                source={{ uri: baseUri }}
                style={{ flex: 1, width: "100%" }}
                contentFit="contain"
                transition={120}
                cachePolicy="none"
                onLoad={(e) => {
                  console.log("[EDITOR] Preview image loaded successfully, URI:", baseUri);
                  onBaseImageLoad();
                }}
                onError={(e) => {
                  console.warn("[EDITOR] Preview image error:", e, "URI:", baseUri);
                  setImgReady(true);
                  if (editorReadyResolve.current) editorReadyResolve.current();
                }}
              />
              {/* Saved effect (base layer) - always show if saved effect exists */}
              {savedLook !== "none" && savedStrength > 0 && (
                <>
                  {savedLook === "tint" && (
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: hexToRgba(savedTint as Hex, savedStrength),
                      }}
                    />
                  )}
                  {savedLook === "night" && (
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: `rgba(0,60,0,${savedStrength})`,
                      }}
                    />
                  )}
                  {savedLook === "thermal" && (
                    <LinearGradient
                      colors={[
                        "rgba(0,0,0,0)",
                        "rgba(255,0,0,1)",
                        "rgba(255,255,0,1)",
                      ]}
                      style={{ 
                        position: "absolute", 
                        left: 0, 
                        top: 0, 
                        width: "100%", 
                        height: "100%",
                        opacity: savedStrength
                      }}
                    />
                  )}
                </>
              )}
              {/* Current effect (can be layered on top) */}
              {look === "tint" && strength > 0 && (
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: hexToRgba(tint as Hex, strength),
                  }}
                />
              )}
              {look === "night" && strength > 0 && (
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: `rgba(0,60,0,${strength})`, // Match camera preview
                  }}
                />
              )}
              {look === "thermal" && strength > 0 && (
                <LinearGradient
                  colors={[
                    "rgba(0,0,0,0)",
                    "rgba(255,0,0,1)",
                    "rgba(255,255,0,1)",
                  ]}
                  style={{ 
                    position: "absolute", 
                    left: 0, 
                    top: 0, 
                    width: "100%", 
                    height: "100%",
                    opacity: strength
                  }}
                />
              )}
            </>
          ) : (
            <View style={{ flex: 1, width: "100%", backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: "#fff" }}>No image URI</Text>
            </View>
          )}
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

        <Button
          label={exporting ? `Exporting ${exportProgress}%` : "Export"}
          onPress={doExport}
          disabled={exporting}
          loading={exporting}
        />

      </View>


    </ScrollView>
    </SafeAreaView>
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

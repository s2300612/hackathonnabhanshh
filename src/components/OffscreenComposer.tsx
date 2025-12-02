import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { hexToRgba, Hex } from "@/lib/tint";

type Look = "none" | "night" | "thermal" | "tint";
/*
- Renders an image with effect overlays (tint, night, thermal) off-screen
- Used by `ViewShot` to capture images with effects "baked in"
- `onLoad` handler: Waits for image to load, then uses double `requestAnimationFrame` + 100ms timeout before calling `onReady`
- Ensures overlays are fully rendered before capture
*/
type Props = {
  uri: string;
  look: Look;
  tintHex?: Hex;
  alpha?: number; // 0..1
  width: number;
  height: number;
  onReady?: () => void;
};

export default function OffscreenComposer({ uri, look, tintHex, alpha, width, height, onReady }: Props) {
  const computedAlpha =
    look === "tint" || look === "night" || look === "thermal" ? alpha ?? 0 : 0;

  console.log("[OffscreenComposer] Rendering with:", { uri: uri?.substring(0, 50), look, tintHex, alpha, computedAlpha, width, height });

  const tintOverlayStyle =
    look === "tint" && computedAlpha > 0 && tintHex
      ? { backgroundColor: hexToRgba(tintHex, computedAlpha) }
      : null;

  const nightOverlayStyle =
    look === "night" && computedAlpha > 0
      ? { backgroundColor: `rgba(0,60,0,${computedAlpha})` }
      : null;

  const thermalOpacity = look === "thermal" && computedAlpha > 0 ? computedAlpha : 0;
  
  console.log("[OffscreenComposer] Overlay styles:", { 
    hasTint: !!tintOverlayStyle, 
    hasNight: !!nightOverlayStyle, 
    thermalOpacity 
  });

  return (
    <View
      key={uri}
      style={{ width: "100%", height: "100%", backgroundColor: "#000" }}
      collapsable={false}
      pointerEvents="none"
    >
      {uri ? (
        <Image
          key={uri}
          source={{ uri }}
          style={{ width: "100%", height: "100%", resizeMode: "cover" }}
          onLoad={() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setTimeout(() => {
                  onReady?.();
                }, 100);
              });
            });
          }}
          onError={(e) => {
            console.warn("[OffscreenComposer] Image load error:", e, "URI:", uri);
            onReady?.();
          }}
        />
      ) : null}

      {tintOverlayStyle && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, tintOverlayStyle]} />
      )}

      {nightOverlayStyle && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, nightOverlayStyle]} />
      )}

      {thermalOpacity > 0 && (
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0)", "rgba(255,0,0,1)", "rgba(255,255,0,1)"]}
          style={[StyleSheet.absoluteFill, { opacity: thermalOpacity }]}
        />
      )}
    </View>
  );
}

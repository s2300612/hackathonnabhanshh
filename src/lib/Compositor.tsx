import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View, Image, StyleSheet } from "react-native";
import ViewShot, { captureRef } from "react-native-view-shot";
import { LinearGradient } from "expo-linear-gradient";

type Look = "none" | "night" | "thermal" | "tint";
type Hex = `#${string}`;

type ComposeArgs = {
  uri: string;
  look: Look;
  tint?: Hex;
  tintAlpha?: number;
  nightAlpha?: number;
  thermalAlpha?: number;
  width?: number;
  height?: number;
};

export type CompositorHandle = {
  compose: (args: ComposeArgs) => Promise<string>;
};

const defaultState: ComposeArgs = {
  uri: "",
  look: "none",
  tint: "#22c55e",
  tintAlpha: 0.35,
  nightAlpha: 0.35,
  thermalAlpha: 0.35,
  width: 1080,
  height: 1440,
};

export const Compositor = forwardRef<CompositorHandle>((_, ref) => {
  const shotRef = useRef<ViewShot>(null);
  const [state, setState] = useState<ComposeArgs>(defaultState);

  useImperativeHandle(ref, () => ({
    async compose(args) {
      setState({ ...defaultState, ...args });
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      if (!shotRef.current) {
        throw new Error("Compositor not ready");
      }
      const uri = await captureRef(shotRef, {
        format: "jpg",
        quality: 0.9,
        result: "tmpfile",
      });
      return uri;
    },
  }));

  const s = state;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} collapsable={false}>
      <ViewShot ref={shotRef} style={styles.offscreen}>
        <View style={{ width: s.width ?? 1080, height: s.height ?? 1440 }}>
          {!!s.uri && (
            <Image
              source={{ uri: s.uri }}
              style={{ width: "100%", height: "100%", resizeMode: "cover" }}
            />
          )}

          {s.look === "night" && (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: `rgba(0,0,0,${s.nightAlpha ?? 0.35})` },
              ]}
            />
          )}

          {s.look === "thermal" && (
            <LinearGradient
              colors={[
                `rgba(255,0,0,${s.thermalAlpha ?? 0.35})`,
                `rgba(255,140,0,${s.thermalAlpha ?? 0.35})`,
              ]}
              style={StyleSheet.absoluteFill}
            />
          )}

          {s.look === "tint" && (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: (s.tint ?? "#22c55e") as string,
                  opacity: s.tintAlpha ?? 0.35,
                },
              ]}
            />
          )}
        </View>
      </ViewShot>
    </View>
  );
});

const styles = StyleSheet.create({
  offscreen: {
    position: "absolute",
    left: -9999,
    top: -9999,
  },
});



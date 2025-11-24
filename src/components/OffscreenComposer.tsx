import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export type Look = "none" | "night" | "thermal" | "tint";

type Props = {
  uri: string;
  look: Look;
  tintHex: string;
  alpha: number;
  width: number;
  height: number;
};

export default function OffscreenComposer({ uri, look, tintHex, alpha, width, height }: Props) {
  const overlay = (() => {
    if (look === "night") {
      return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,60,${alpha || 0.35})` }]} />;
    }

    if (look === "thermal") {
      const value = alpha || 0.35;
      return (
        <LinearGradient
          pointerEvents="none"
          colors={[`rgba(255,0,0,${value})`, `rgba(255,140,0,${value})`]}
          style={StyleSheet.absoluteFill}
        />
      );
    }

    if (look === "tint") {
      return (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: tintHex,
              opacity: alpha || 0.35,
            },
          ]}
        />
      );
    }

    return null;
  })();

  return (
    <View style={[styles.root, { width, height }]}>
      {!!uri && (
        <Image source={{ uri }} style={{ width, height, resizeMode: "contain" }} />
      )}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "black",
    overflow: "hidden",
  },
});



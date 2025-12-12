import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Pulse } from "@/stores/checkin-store";
import MaldivesMapSVG from "../../assets/maldives-map.svg";

type Props = {
  pulses?: Pulse[];
};

function GlowDot({ mood }: { mood: "sunny" | "stormy" }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  // Sunny = yellow, Stormy = purple
  const coreColor = mood === "sunny" ? "#FFD54A" : "#B47CFF";
  const ringColor = mood === "sunny" ? "rgba(255,213,74,0.6)" : "rgba(180,124,255,0.6)";

  return (
    <View style={styles.dotWrap}>
      <Animated.View
        style={[
          styles.ring,
          { backgroundColor: ringColor, opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      <View style={[styles.core, { backgroundColor: coreColor }]} />
    </View>
  );
}

export default function PulseMap({ pulses }: Props) {
  const recent = useMemo(() => {
    if (!pulses) return [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return pulses.filter((p) => new Date(p.createdAt).getTime() >= cutoff);
  }, [pulses]);

  return (
    <View className="bg-[#0b1220] rounded-3xl p-4 border border-white/10">
      <Text className="text-white text-lg font-semibold mb-2">Pulse Map</Text>
      <Text className="text-gray-400 text-sm mb-3">
        Last 24h check-ins across Maldives.
      </Text>
      <View style={styles.card}>
        <View style={styles.mapContainer}>
          <MaldivesMapSVG width="100%" height="100%" />
        </View>
        {recent.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No check-ins yet. Be the first to add a pulse.</Text>
          </View>
        )}
      </View>
      <Text className="text-gray-500 text-xs mt-2 text-center">
        © OpenStreetMap contributors · Tiles © Carto
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    height: 320,
    position: "relative",
  },
  mapContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
  },
  dotWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 999,
  },
  core: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
});

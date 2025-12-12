import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT, Region } from "react-native-maps";
import { Pulse } from "@/stores/checkin-store";

type Props = {
  pulses?: Pulse[];
};

const MALDIVES_REGION: Region = {
  latitude: 3.2,
  longitude: 73.2,
  latitudeDelta: 6.0,
  longitudeDelta: 6.0,
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
    <View className="bg-[#1E1E1E] rounded-3xl p-4 border border-white/10">
      <Text className="text-white text-lg font-semibold mb-2">Pulse Map</Text>
      <Text className="text-gray-400 text-sm mb-3">
        Real-time emotional weather across Maldives (last 24h).
      </Text>
      <View style={styles.card}>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={MALDIVES_REGION}
          mapType="none"
          rotateEnabled={false}
          pitchEnabled={false}
          scrollEnabled={true}
          zoomEnabled={true}
        >
          {/* OpenStreetMap tiles */}
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />

          {recent.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <GlowDot mood={p.mood} />
            </Marker>
          ))}
        </MapView>
        {recent.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No check-ins yet. Be the first to add a pulse.</Text>
          </View>
        )}
      </View>
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
  },
  map: {
    width: "100%",
    height: 320,
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

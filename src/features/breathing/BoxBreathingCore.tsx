import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  start?: boolean;
  onComplete?: () => void;
  size?: number;
  color?: string;
};

const phases = ["Inhale", "Hold", "Exhale", "Hold"] as const;

export default function BoxBreathingCore({
  start = false,
  onComplete,
  size = 80,
  color = "#22c55e",
}: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (start) {
      // Reset state
      setPhaseIndex(0);
      setCycle(0);

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Change phase every 4 seconds
      intervalRef.current = setInterval(() => {
        setPhaseIndex((prev) => {
          const next = (prev + 1) % phases.length;
          
          // If we completed a full cycle (4 phases), increment cycle
          if (next === 0) {
            setCycle((c) => {
              const newCycle = c + 1;
              // After 4 cycles, complete
              if (newCycle >= 4) {
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
                // Call onComplete in next tick to avoid setState during render
                setTimeout(() => onComplete?.(), 0);
                return c; // Keep at 4
              }
              return newCycle;
            });
          }
          
          return next;
        });
      }, 4000);
    } else {
      // Stop interval when not started
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [start, onComplete]);

  const currentPhase = phases[phaseIndex];
  
  // Determine text color based on background color
  // For teal (#00FFE0), use white text. For green (#22c55e), use dark text.
  const textColor = color === "#00FFE0" ? "#020617" : "#020617";

  return (
    <View style={styles.container}>
      <View
        style={[
          {
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Text style={[styles.phaseText, { color: textColor }]}>
          {currentPhase}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  phaseText: {
    fontSize: 20,
    fontWeight: "600",
  },
});


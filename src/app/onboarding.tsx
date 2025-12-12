import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useUserStore } from "@/stores/user-store";

const ATOLLS = [
  "Haa Alif (HA)",
  "Haa Dhaalu (HDh)",
  "Shaviyani (Sh)",
  "Noonu (N)",
  "Raa (R)",
  "Baa (B)",
  "Lhaviyani (Lh)",
  "Kaafu (K)",
  "Alif Alif (AA)",
  "Alif Dhaalu (ADh)",
  "Vaavu (V)",
  "Meemu (M)",
  "Faafu (F)",
  "Dhaalu (Dh)",
  "Thaa (Th)",
  "Laamu (L)",
  "Gaafu Alif (GA)",
  "Gaafu Dhaalu (GDh)",
  "Gnaviyani (Gn)",
  "Seenu / Addu (S)",
  "Malé (Capital)",
];

type Step = 1 | 2 | 3;

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>(1);

  const [nickname, setNickname] = useState("");
  const [atoll, setAtoll] = useState<string | null>(null);
  const [mood, setMood] = useState<"Sunny" | "Stormy" | null>(null);

  const [atollModalOpen, setAtollModalOpen] = useState(false);
  const setProfile = useUserStore((s) => s.setProfile);

  const canContinue = useMemo(() => {
    return nickname.trim().length > 0 && !!atoll && mood !== null;
  }, [nickname, atoll, mood]);

  function nextFromNickname() {
    if (nickname.trim().length === 0) return;
    setStep(2);
  }

  function nextFromAtoll() {
    if (!atoll) return;
    setStep(3);
  }

  function handleContinue() {
    if (!canContinue) return;
    // Persist the profile so the name sticks immediately
    setProfile(nickname.trim(), atoll!);
    router.replace("/onboarding-done");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sirru – Onboarding</Text>

      {/* Step 1: Nickname */}
      {step >= 1 && (
        <View style={styles.block}>
          <Text style={styles.label}>Nickname</Text>
          <TextInput
            value={nickname}
            onChangeText={(t) => setNickname(t)}
            placeholder="Choose a nickname"
            placeholderTextColor="#6b7280"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={nextFromNickname}
          />

          {step === 1 && (
            <TouchableOpacity
              onPress={nextFromNickname}
              style={[
                styles.secondaryBtn,
                nickname.trim().length === 0 && { opacity: 0.4 },
              ]}
              disabled={nickname.trim().length === 0}
            >
              <Text style={styles.secondaryText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Step 2: Atoll Picker */}
      {step >= 2 && (
        <View style={styles.block}>
          <Text style={styles.label}>Atoll</Text>

          <Pressable
            onPress={() => setAtollModalOpen(true)}
            style={styles.pickerButton}
          >
            <Text style={[styles.pickerText, !atoll && { color: "#6b7280" }]}>
              {atoll ?? "Select your atoll"}
            </Text>
          </Pressable>

          {step === 2 && (
            <TouchableOpacity
              onPress={nextFromAtoll}
              style={[styles.secondaryBtn, !atoll && { opacity: 0.4 }]}
              disabled={!atoll}
            >
              <Text style={styles.secondaryText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Step 3: Mood */}
      {step >= 3 && (
        <View style={styles.block}>
          <Text style={styles.label}>How is your weather?</Text>
          <View style={styles.row}>
            {["Sunny", "Stormy"].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMood(m as "Sunny" | "Stormy")}
                style={[styles.moodButton, mood === m && styles.moodButtonActive]}
              >
                <Text
                  style={[styles.moodText, mood === m && styles.moodTextActive]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && { opacity: 0.35 }]}
            disabled={!canContinue}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal: scrollable atoll list */}
      <Modal
        visible={atollModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAtollModalOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setAtollModalOpen(false)}
        />

        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select your atoll</Text>

          <FlatList
            data={ATOLLS}
            keyExtractor={(item) => item}
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setAtoll(item);
                  setAtollModalOpen(false);
                }}
                style={styles.modalItem}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </Pressable>
            )}
          />

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setAtollModalOpen(false)}
          >
            <Text style={styles.secondaryText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
  },
  block: {
    marginBottom: 18,
  },
  label: {
    color: "#e5e7eb",
    marginBottom: 6,
    marginTop: 8,
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "white",
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pickerText: {
    color: "white",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  moodButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#4b5563",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  moodButtonActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  moodText: {
    color: "white",
    fontSize: 16,
  },
  moodTextActive: {
    color: "#020617",
    fontWeight: "700",
  },
  continueBtn: {
    backgroundColor: "#38bdf8",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueText: {
    color: "#020617",
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryBtn: {
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#6b7280",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: "#e5e7eb",
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    paddingBottom: 24,
  },
  modalTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  modalItemText: {
    color: "#e5e7eb",
    fontSize: 15,
  },
});

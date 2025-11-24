import React from "react";
import { View, Image, StyleSheet, Alert, TouchableOpacity, Text } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useStores } from "@/stores";

const ViewerScreen = observer(() => {
  const params = useLocalSearchParams<{ id?: string; uri?: string }>();
  const { camera } = useStores();
  const router = useRouter();

  const shot = params.id ? camera.recent.find((s) => String(s.id) === String(params.id)) : undefined;
  const displayUri = shot?.bakedUri ?? shot?.uri ?? (typeof params.uri === "string" ? params.uri : undefined);

  if (!displayUri) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Viewer" }} />
        <Text style={{ color: "#fff" }}>Photo not found.</Text>
        <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={() => router.replace("/(app)/album")}>
          <Text style={styles.btnText}>Back to Album</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDelete = () => {
    if (!shot) return;
    Alert.alert("Delete", "Remove this photo from the app?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          camera.removeShot(shot.id);
          router.replace("/(app)/album");
        },
      },
    ]);
  };

  const handleEdit = () => {
    const sourceUri = shot?.uri ?? displayUri;
    router.push({
      pathname: "/(app)/photo",
      params: {
        sourceUri,
        effect: shot?.look,
        tintHex: shot?.tint,
        strength: shot?.alpha != null ? String(shot.alpha) : undefined,
      },
    });
  };

  const handleExport = () => {
    router.push({
      pathname: "/(app)/photo",
      params: { sourceUri: displayUri, autoExport: "true" },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Photo Viewer", headerShown: true }} />
      <Image source={{ uri: displayUri }} style={styles.image} />
      <View style={styles.row}>
        <ActionButton label="Back" onPress={() => router.back()} />
        <ActionButton label="Edit" onPress={handleEdit} />
        <ActionButton label="Export" onPress={handleExport} />
        {shot && <ActionButton label="Delete" danger onPress={handleDelete} />}
      </View>
    </View>
  );
});

function ActionButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.btn, danger && styles.dangerBtn]}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", padding: 16 },
  image: { flex: 1, resizeMode: "contain" },
  row: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "space-between",
  },
  btn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#111",
    alignItems: "center",
  },
  dangerBtn: {
    backgroundColor: "#ef4444",
  },
  btnText: { color: "#fff", fontWeight: "600" },
});

export default ViewerScreen;



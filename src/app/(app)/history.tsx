import React, { useMemo } from "react";
import { View, Text, FlatList, Image, Alert, Pressable, StyleSheet, ScrollView } from "react-native";
import { Stack, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { useStores } from "@/stores";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date";
import * as MediaLibrary from "expo-media-library";
import { getMediaPermission, ALBUM } from "@/lib/camera-permissions";

function HistoryScreenImpl() {
  const router = useRouter();
  const { auth, history, camera } = useStores();

  React.useEffect(() => {
    if (!auth.signedIn) router.replace("/login");
  }, [auth.signedIn, router]);
  const data = useMemo(() => history?.filteredSortedEdits ?? [], [history?.filteredSortedEdits]);

  const clear = () =>
    Alert.alert("Clear history", "Remove all edited photos from history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => history?.clearEdits?.() },
    ]);

  const handleResume = (item: typeof data[0]) => {
    router.push({
      pathname: "/(app)/photo",
      params: {
        mode: "edit",
        sourceUri: item.sourceUri,
        effect: item.effect,
        tintHex: item.tintHex ?? "",
        strength: String(item.strength),
        editId: item.id,
      },
    });
  };

  const handleReEdit = (item: typeof data[0]) => {
    router.push({
      pathname: "/(app)/photo",
      params: {
        mode: "edit",
        sourceUri: item.sourceUri,
        effect: item.effect,
        tintHex: item.tintHex ?? "",
        strength: String(item.strength),
      },
    });
  };

  const handleExport = (item: typeof data[0]) => {
    // Navigate to editor in export mode - user can export from there
    router.push({
      pathname: "/(app)/photo",
      params: {
        mode: "edit",
        sourceUri: item.sourceUri,
        effect: item.effect,
        tintHex: item.tintHex ?? "",
        strength: String(item.strength),
        editId: item.id,
        autoExport: "true",
      },
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Remove this history entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => history?.deleteEdit?.(id) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "History" }} />
      
      {/* Filter Chips */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff", marginTop: 8, marginBottom: 8 }}>
        {/* chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          style={{ flexGrow: 1 }}
        >
          {(["all", "drafts", "exported"] as const).map((f) => {
            const active = history?.filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => history?.setFilter?.(f)}
                style={{
                  paddingHorizontal: 14,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? "#000" : "#EDEEEF",
                  marginRight: 8,
                }}
              >
                <Text style={{ color: active ? "#FFF" : "#111", fontWeight: "600", textTransform: "capitalize" }}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* sort toggle pinned on the right */}
        <Pressable
          onPress={() => history?.setSort?.(history?.sort === "newest" ? "oldest" : "newest")}
          style={{ paddingHorizontal: 6, paddingVertical: 8 }}
        >
          <Text style={{ color: "#1d4ed8", fontWeight: "700" }}>
            {history?.sort === "newest" ? "Oldest" : "Newest"}
          </Text>
        </Pressable>
      </View>

      {data.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
          <Text style={{ opacity: 0.75, fontSize: 16, marginBottom: 8 }}>No edited photos yet.</Text>
          <Button label="Go to Camera+" onPress={() => router.push("/(app)/camera-advanced")} size="sm" />
        </View>
      ) : (
        <>
          <FlatList
            data={data}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 80 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => {
              const effectName = item.effect === "none" ? "Original" : item.effect.charAt(0).toUpperCase() + item.effect.slice(1);
              const tintInfo = item.effect === "tint" && item.tintHex ? ` ${item.tintHex}` : "";
              const formattedDate = formatDate(item.createdAt);
              
              return (
                <Pressable
                  onLongPress={() => handleDelete(item.id)}
                  style={styles.itemContainer}
                >
                  <Image
                    source={{ uri: item.exportedUri ?? item.sourceUri }}
                    style={styles.thumbnail}
                  />
                  <View style={styles.details}>
                    <View style={styles.headerRow}>
                      <Text style={styles.effectName}>
                        {effectName}
                        {tintInfo ? <Text style={styles.tintInfo}>{tintInfo}</Text> : null}
                      </Text>
                      <View style={[styles.badge, item.status === "exported" ? styles.exportedBadge : styles.draftBadge]}>
                        <Text style={styles.badgeText}>{item.status === "exported" ? "Exported" : "Draft"}</Text>
                      </View>
                    </View>
                    <Text style={styles.subtitle}>
                      {Math.round(item.strength * 100)}% • {formattedDate}
                    </Text>
                    <Text style={styles.uriText} numberOfLines={1} ellipsizeMode="middle">
                      {item.exportedUri ?? item.sourceUri}
                    </Text>
                    <View style={styles.actionsRow}>
                      {item.status === "draft" ? (
                        <>
                          <Button
                            label="Resume"
                            onPress={() => handleResume(item)}
                            size="sm"
                            variant="default"
                            fullWidth={false}
                          />
                          <Button
                            label="Export"
                            onPress={() => handleExport(item)}
                            size="sm"
                            variant="outline"
                            fullWidth={false}
                          />
                        </>
                      ) : (
                        <Button
                          label="Re-edit"
                          onPress={() => handleReEdit(item)}
                          size="sm"
                          variant="default"
                          fullWidth={false}
                        />
                      )}
                      <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
          <View style={styles.clearButtonContainer}>
            <Pressable onPress={clear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear history</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  details: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  effectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  tintInfo: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  exportedBadge: {
    backgroundColor: "#10b981",
  },
  draftBadge: {
    backgroundColor: "#6b7280",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  timestampText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  uriText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
    fontFamily: "monospace",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    alignItems: "center",
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
  },
  clearButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  clearButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#ef4444",
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default observer(HistoryScreenImpl);

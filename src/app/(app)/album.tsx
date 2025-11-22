import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Image, Pressable, Alert } from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { useStores } from "@/stores";
import { getMediaPermission, ALBUM } from "@/lib/camera-permissions";

type Shot = { id: string; uri: string; picked?: boolean };

function AlbumScreenImpl() {
  const router = useRouter();
  const { camera, history } = useStores();
  const [items, setItems] = useState<Shot[]>([]);
  const [canRead, setCanRead] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const load = useCallback(async (hasRead: boolean) => {
    setLoading(true);
    try {
      if (!hasRead) {
        setItems([]);
        return; // never touch device album
      }

      const album = await MediaLibrary.getAlbumAsync(ALBUM);
      if (!album) {
        setItems([]);
        return;
      }

      const assets = await MediaLibrary.getAssetsAsync({
        album,
        mediaType: ["photo"],
        first: 200,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      const list = assets.assets
        .map(a => ({ id: String(a.id), uri: String(a.uri) }))
        .filter(x => x.uri);

      const uniq = new Map(list.map(x => [x.id, x]));
      setItems(Array.from(uniq.values()));
    } catch (e) {
      console.warn("Album load error", e);
      Alert.alert("Album error", "Unable to read the device album.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission", "Gallery permission is required to pick images.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,      // iOS 14+, Android 13+; falls back to single elsewhere
        selectionLimit: 0,                  // 0 = no limit (where supported)
        quality: 1,
      });

      if (res.canceled) return;

      const picked: Shot[] = (res.assets ?? [])
        .map((a, idx) => ({
          id: (a.assetId ?? a.uri ?? `picked-${Date.now()}-${idx}`).toString(),
          uri: a.uri.toString(),
          picked: true,
        }))
        .filter(x => !!x.uri);

      // Create draft entry and navigate to editor for first picked image
      if (picked.length > 0) {
        const firstUri = picked[0].uri;
        const draft = history.addDraft({
          sourceUri: firstUri,
          effect: "none",
          strength: camera.tintAlpha,
        });
        
        router.push({
          pathname: "/(app)/photo",
          params: {
            mode: "edit",
            sourceUri: firstUri,
            effect: "none",
            strength: String(camera.tintAlpha),
            editId: draft.id,
          },
        });
      }

      // de-dupe by uri and merge
      setItems(prev => {
        const seen = new Set<string>();
        const merged = [...picked, ...prev].filter(x => {
          if (seen.has(x.uri)) return false;
          seen.add(x.uri);
          return true;
        });
        return merged;
      });
    } catch (e: any) {
      Alert.alert("Gallery", String(e?.message ?? e));
    }
  }, []);

  useEffect(() => {
    (async () => {
      const mp = await getMediaPermission();
      setCanRead(mp.canRead);
      await load(mp.canRead); // pass the flag so load() can skip device calls
    })();
  }, [load]);

  // Combine MediaLibrary items with MobX recent shots as additional fallback
  const allShots = useMemo(() => {
    const seen = new Set<string>();
    const combined: Shot[] = [];
    
    // Add MediaLibrary items first (preferred)
    items.forEach(item => {
      if (!seen.has(item.uri)) {
        seen.add(item.uri);
        combined.push(item);
      }
    });
    
    // Add MobX recent shots that aren't already included
    camera.recent.forEach(item => {
      if (!seen.has(item.uri)) {
        seen.add(item.uri);
        combined.push({ id: item.id, uri: item.uri });
      }
    });
    
    return combined;
  }, [items, camera.recent]);

  const openEditor = (shot: Shot) => {
    router.push({ pathname: "/(app)/photo", params: { uri: shot.uri } });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>Album</Text>

        {!canRead && (
          <View style={{ gap: 8, marginBottom: 12 }}>
            <Text style={{ opacity: 0.75 }}>
              Reading the device album is limited until Photos/Media permission is granted.
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button label="Pick from Gallery" onPress={pickFromGallery} size="sm" />
            </View>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
          <Button
            label="View History"
            variant="outline"
            onPress={() => router.push("/(app)/history")}
            size="sm"
            fullWidth={false}
          />
        </View>

        <FlatList
          contentContainerStyle={{ gap: 8, padding: 8 }}
          numColumns={3}
          columnWrapperStyle={{ gap: 8 }}
          data={allShots.filter(i => !!i.uri && i.uri.length > 0)}
          keyExtractor={(it) => String(it.id)}
          ListHeaderComponent={
            !canRead ? (
              <Text style={{ opacity: 0.7, marginBottom: 8, paddingHorizontal: 8 }}>
                Showing local only (no read permission).
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => openEditor(item)} 
              style={{ width: "31%", aspectRatio: 1, borderRadius: 8, overflow: "hidden" }}
            >
              <Image
                source={{ uri: item.uri }}
                style={{ width: "100%", height: "100%", backgroundColor: "#ddd" }}
              />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ marginTop: 12, opacity: 0.75, padding: 16 }}>
              {loading ? "Loading…" : "No photos yet. Use Pick from Gallery or capture photos in Camera+."}
            </Text>
          }
        />
      </View>
    </View>
  );
}

export default observer(AlbumScreenImpl);

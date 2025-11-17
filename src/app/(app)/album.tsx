import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { requestMediaPermission, ALBUM } from "@/lib/camera-permissions";
import { useStores } from "@/stores";

function AlbumScreenImpl() {
  const [canRead, setCanRead] = useState(false);
  const [deviceShots, setDeviceShots] = useState<{ id: string; uri: string }[]>([]);
  const router = useRouter();
  const { camera } = useStores();

  const load = useCallback(async () => {
    try {
      const album = await MediaLibrary.getAlbumAsync(ALBUM);
      if (!album) { setDeviceShots([]); return; }
      const result = await MediaLibrary.getAssetsAsync({
        album, mediaType: ["photo"], first: 200, sortBy: [["creationTime", false]],
      });
      const list = result.assets
        .map(a => ({ id: String(a.id), uri: String(a.uri) }))
        .filter(x => x.uri.length > 0);
      const uniq = new Map(list.map(x => [x.id, x]));
      setDeviceShots(Array.from(uniq.values()));
    } catch (e: any) {
      console.warn("Album load error", e?.message ?? e);
      Alert.alert("Album error", "Unable to read the device album.");
    }
  }, []);

  // Combine device album (if available) with MobX recent shots
  const allShots = useMemo(() => {
    if (canRead && deviceShots.length > 0) {
      // When device album is available, prefer it
      return deviceShots;
    }
    // Fallback to MobX recent shots
    return camera.recent;
  }, [canRead, deviceShots, camera.recent]);

  useEffect(() => {
    (async () => {
      const mp = await requestMediaPermission();
      setCanRead(!!mp.canRead);
      if (mp.canRead) await load();
    })();
  }, [load]);

  if (!canRead) {
    return (
      <View style={{ flex:1, padding:16 }}>
        <Text style={{ fontSize:18, fontWeight:"700" }}>Album</Text>
        <Text style={{ marginTop:8 }}>
          Grant Photos/Media permission for Expo Go, then reopen this tab.
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          <Button
            label="Style"
            variant="outline"
            onPress={() => router.push("/(app)/style")}
            fullWidth={false}
            size="sm"
          />
          <Button
            label="Process"
            variant="outline"
            onPress={() => {
              if (allShots.length > 0) {
                router.push({ pathname: "/(app)/process", params: { uri: allShots[0].uri } });
              } else {
                Alert.alert("No photos", "Capture some photos first to process them.");
              }
            }}
            fullWidth={false}
            size="sm"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12, flexDirection: "row", gap: 8, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
        <Button
          label="Style"
          variant="outline"
          onPress={() => router.push("/(app)/style")}
          fullWidth={false}
          size="sm"
        />
        <Button
          label="Process"
          variant="outline"
          onPress={() => {
            if (allShots.length > 0) {
              router.push({ pathname: "/(app)/process", params: { uri: allShots[0].uri } });
            } else {
              Alert.alert("No photos", "Capture some photos first to process them.");
            }
          }}
          fullWidth={false}
          size="sm"
        />
      </View>
    <FlatList
        contentContainerStyle={{ padding:8 }}
        data={allShots}
        keyExtractor={(it) => it.id}
      numColumns={3}
        columnWrapperStyle={{ gap:8 }}
        ItemSeparatorComponent={() => <View style={{ height:8 }} />}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: "/(app)/photo", params: { uri: item.uri } })}
            style={{ width:"31%", aspectRatio:1, borderRadius:8, overflow:"hidden" }}
        >
            <Image source={{ uri: item.uri }} style={{ width:"100%", height:"100%" }} />
        </Pressable>
      )}
        ListEmptyComponent={
          <Text style={{ padding:16 }}>
            {canRead ? `No photos found in ${ALBUM} yet.` : "No recent photos. Capture some in Camera+."}
          </Text>
        }
      />
    </View>
  );
}

export default observer(AlbumScreenImpl);


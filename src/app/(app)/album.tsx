import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { requestMediaPermission, ALBUM } from "@/lib/camera-permissions";

type Shot = { id: string; uri: string };

export default function AlbumScreen() {
  const [canRead, setCanRead] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const album = await MediaLibrary.getAlbumAsync(ALBUM);
      if (!album) { setShots([]); return; }
      const result = await MediaLibrary.getAssetsAsync({
        album, mediaType: ["photo"], first: 200, sortBy: [["creationTime", false]],
      });
      const list = result.assets
        .map(a => ({ id: String(a.id), uri: String(a.uri) }))
        .filter(x => x.uri.length > 0);
      const uniq = new Map(list.map(x => [x.id, x]));
      setShots(Array.from(uniq.values()));
    } catch (e:any) {
      console.warn("Album load error", e?.message ?? e);
      Alert.alert("Album error", "Unable to read the device album.");
    }
  }, []);

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
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding:8 }}
      data={shots}
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
      ListEmptyComponent={<Text style={{ padding:16 }}>No photos found in {ALBUM} yet.</Text>}
    />
  );
}


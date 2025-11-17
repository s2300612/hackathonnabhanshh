import React, { useRef, useState } from "react";
import { View, Text, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { Button } from "@/components/ui/button";
import { useLocalSearchParams, router } from "expo-router";

const HTML = (uri: string) => `
<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>html,body{margin:0;padding:0;background:#111;color:#eee;font-family:sans-serif}</style>
</head><body>
<canvas id="c"></canvas>
<script>
const img = new Image();
img.crossOrigin = "anonymous";
img.onload = () => {
  const c = document.getElementById('c'); const ctx = c.getContext('2d');
  c.width = img.width; c.height = img.height;
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0,0,c.width,c.height);
  const d = imgData.data;
  for (let i=0;i<d.length;i+=4){
    const r=d[i], g=d[i+1], b=d[i+2];
    const isRed = r > 150 && r > g*1.2 && r > b*1.2;
    if (!isRed){
      const gray = 0.299*r + 0.587*g + 0.114*b;
      d[i]=d[i+1]=d[i+2]=gray;
    }
  }
  ctx.putImageData(imgData,0,0);
  // send back data URL
  window.ReactNativeWebView.postMessage(c.toDataURL('image/png'));
};
img.src = ${JSON.stringify(uri)};
</script>
</body></html>
`;

export default function ProcessScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const webRef = useRef<WebView>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onMessage = async (e: any) => {
    setDataUrl(e.nativeEvent.data);
  };

  const save = async () => {
    if (!dataUrl) return;
    try {
      setSaving(true);
      Alert.alert(
        "Preview only",
        "Saving the processed PNG is optional for coursework. Screenshot to keep."
      );
    } catch (e) {
      Alert.alert("Save failed", String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!uri) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>No image provided.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{ flexDirection: "row", gap: 8, padding: 8, justifyContent: "space-between" }}
      >
        <Button label="Back" variant="outline" onPress={() => router.back()} fullWidth={false} />
        <Button
          label={saving ? "Saving…" : "Save"}
          onPress={save}
          disabled={saving || !dataUrl}
          fullWidth={false}
        />
      </View>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: HTML(uri as string) }}
        onMessage={onMessage}
        style={{ flex: 1 }}
      />
    </View>
  );
}


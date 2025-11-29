import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import Constants from "expo-constants";

type DiagStatus = "PASS" | "FAIL" | "WARN";

type DiagItem = {
  id: string;
  label: string;
  status: DiagStatus;
  detail?: string;
};

type DiagResults = {
  runAt: string;
  device: {
    os: string;
    osVersion: string | number | undefined;
    appVersion?: string;
    expoConfig?: any;
  };
  permissionInitial?: any;
  permissionAddOnly?: any;
  dummyWrite?: {
    uri?: string;
    error?: string;
  };
  albumReadCalls: {
    getAlbumAsyncCalled: boolean;
    addAssetsToAlbumAsyncCalled: boolean;
  };
  items: DiagItem[];
  recommendation?: string;
};

const ONE_BY_ONE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

async function runDiagnosticsOnce(): Promise<DiagResults> {
  const items: DiagItem[] = [];

  const now = new Date();
  const device = {
    os: Platform.OS,
    osVersion: Platform.Version,
    appVersion: Constants.expoConfig?.version,
    expoConfig: {
      sdkVersion: Constants.expoConfig?.sdkVersion,
      name: Constants.expoConfig?.name,
    },
  };

  // Track album read attempts
  const albumReadCalls = {
    getAlbumAsyncCalled: false,
    addAssetsToAlbumAsyncCalled: false,
  };

  const libAny = MediaLibrary as any;
  const originalGetAlbumAsync = libAny.getAlbumAsync;
  const originalAddAssetsToAlbumAsync = libAny.addAssetsToAlbumAsync;

  libAny.getAlbumAsync = async (...args: any[]) => {
    albumReadCalls.getAlbumAsyncCalled = true;
    if (originalGetAlbumAsync) {
      return originalGetAlbumAsync(...args);
    }
    return null;
  };

  libAny.addAssetsToAlbumAsync = async (...args: any[]) => {
    albumReadCalls.addAssetsToAlbumAsyncCalled = true;
    if (originalAddAssetsToAlbumAsync) {
      return originalAddAssetsToAlbumAsync(...args);
    }
    return null;
  };

  let permissionInitial: any = undefined;
  let permissionAddOnly: any = undefined;
  let dummyWrite: { uri?: string; error?: string } = {};
  let recommendation: string | undefined;

  try {
    // 1) Initial permission state
    permissionInitial = await MediaLibrary.getPermissionsAsync();
    console.log("[EXPORT_DIAG] initial permissions", permissionInitial);

    items.push({
      id: "perm-initial",
      label: "Initial MediaLibrary permissions",
      status: permissionInitial?.granted ? "PASS" : "WARN",
      detail: JSON.stringify(permissionInitial),
    });

    // 2) Request add-only permission (write-only on Android)
    console.log("[EXPORT_DIAG] requesting addOnly permission…");
    try {
      // @ts-ignore - accessPrivileges is iOS only, boolean param is Android writeOnly
      permissionAddOnly = await MediaLibrary.requestPermissionsAsync(
        Platform.OS === "ios" ? { accessPrivileges: "addOnly" } : true
      );
    } catch (err) {
      permissionAddOnly = { error: String(err) };
    }

    console.log("[EXPORT_DIAG] addOnly permissions", permissionAddOnly);

    items.push({
      id: "perm-addonly",
      label: "Request addOnly / write-only permission",
      status: permissionAddOnly?.granted ? "PASS" : "FAIL",
      detail: JSON.stringify(permissionAddOnly),
    });

    if (!permissionAddOnly?.granted && permissionAddOnly?.canAskAgain === false) {
      recommendation =
        "Open Settings → Apps → Expo Go (or your dev build) → Permissions → Photos and videos → Allow.";
    }

    // 3) Dummy 1x1 PNG write + createAssetAsync
    try {
      const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!baseDir) {
        throw new Error("No cache/document directory available");
      }
      const uri = `${baseDir}export-diag-1x1-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(uri, ONE_BY_ONE_PNG_BASE64, {
        encoding: FileSystem.EncodingType.Base64 as any,
      });

      dummyWrite.uri = uri;
      console.log("[EXPORT_DIAG] dummy file uri", uri);

      if (!uri.startsWith("file://")) {
        throw new Error(`Dummy file is not a file:// URI: ${uri}`);
      }

      await MediaLibrary.createAssetAsync(uri);

      items.push({
        id: "dummy-asset",
        label: "Create dummy 1x1 PNG asset",
        status: "PASS",
        detail: uri,
      });
    } catch (err: any) {
      dummyWrite.error = String(err?.message ?? err);
      console.warn("[EXPORT_DIAG] dummy write/createAssetAsync failed", err);
      items.push({
        id: "dummy-asset",
        label: "Create dummy 1x1 PNG asset",
        status: "FAIL",
        detail: dummyWrite.error,
      });
    }

    // 4) Album read attempts during run
    items.push({
      id: "album-read",
      label: "Album read APIs called during diagnostics",
      status:
        albumReadCalls.getAlbumAsyncCalled || albumReadCalls.addAssetsToAlbumAsyncCalled
          ? "WARN"
          : "PASS",
      detail: JSON.stringify(albumReadCalls),
    });
  } finally {
    // restore patched methods
    libAny.getAlbumAsync = originalGetAlbumAsync;
    libAny.addAssetsToAlbumAsync = originalAddAssetsToAlbumAsync;
  }

  const results: DiagResults = {
    runAt: now.toISOString(),
    device,
    permissionInitial,
    permissionAddOnly,
    dummyWrite,
    albumReadCalls,
    items,
    recommendation,
  };

  // Write to app documents for in-app access
  try {
    const target = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? ""}export_diag_last.json`;
    if (target) {
      await FileSystem.writeAsStringAsync(target, JSON.stringify(results, null, 2));
      console.log("[EXPORT_DIAG] wrote results to", target);
    }
  } catch (e) {
    console.warn("[EXPORT_DIAG] failed to write export_diag_last.json", e);
  }

  // Always log a single JSON blob we can copy into the repo if needed
  console.log("[EXPORT_DIAG_JSON]", JSON.stringify(results, null, 2));

  return results;
}

const ExportDiagnosticsScreen: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DiagResults | null>(null);

  const onRun = useCallback(async () => {
    if (running) return;
    setRunning(true);
    try {
      const res = await runDiagnosticsOnce();
      setResults(res);
    } catch (e) {
      console.warn("[EXPORT_DIAG] error while running diagnostics", e);
    } finally {
      setRunning(false);
    }
  }, [running]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Export Diagnostics</Text>

        <Text style={styles.subtitle}>
          This DEV-only screen runs a small MediaLibrary self-test and logs details to Metro.
        </Text>

        <TouchableOpacity
          style={[styles.button, running && styles.buttonDisabled]}
          onPress={onRun}
          disabled={running}
        >
          <Text style={styles.buttonText}>{running ? "Running…" : "Run Diagnostics"}</Text>
        </TouchableOpacity>

        {results && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Device / App</Text>
              <Text style={styles.code}>
                OS: {results.device.os} {String(results.device.osVersion)}
              </Text>
              <Text style={styles.code}>App version: {results.device.appVersion ?? "n/a"}</Text>
              <Text style={styles.code}>
                SDK: {results.device.expoConfig?.sdkVersion ?? "n/a"}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Checks</Text>
              {results.items.map((it) => (
                <View key={it.id} style={styles.row}>
                  <Text style={styles.cellLabel}>{it.label}</Text>
                  <Text
                    style={[
                      styles.cellStatus,
                      it.status === "PASS"
                        ? styles.pass
                        : it.status === "FAIL"
                        ? styles.fail
                        : styles.warn,
                    ]}
                  >
                    {it.status}
                  </Text>
                </View>
              ))}
            </View>

            {results.recommendation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recommendation</Text>
                <Text style={styles.text}>{results.recommendation}</Text>
              </View>
            )}
          </>
        )}

        {!results && (
          <View style={styles.section}>
            <Text style={styles.text}>
              No diagnostics run yet. Tap &quot;Run Diagnostics&quot; to execute the checks.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  section: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: "#111827",
  },
  code: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) ?? "monospace",
    fontSize: 12,
    color: "#4b5563",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  cellLabel: {
    flex: 1,
    fontSize: 14,
  },
  cellStatus: {
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  pass: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  fail: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  warn: {
    backgroundColor: "#fef9c3",
    color: "#92400e",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#f9fafb",
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  secondaryText: {
    color: "#111827",
    fontWeight: "600",
  },
});

export default ExportDiagnosticsScreen;



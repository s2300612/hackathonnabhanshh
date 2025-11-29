// src/lib/files.ts
import * as FileSystem from "expo-file-system";

// Copy a temp file (camera/viewshot) to an app-owned permanent path.
// Returns the new URI or null if failed.
export async function persistTemp(uri: string, subdir = "baked"): Promise<string | null> {
  try {
    if (!uri) return null;
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || !info.size) return null;
    const dir = FileSystem.documentDirectory + subdir + "/";
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const filename = uri.split("/").pop() || `img_${Date.now()}.jpg`;
    const dest = dir + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return null;
  }
}

export async function exists(uri?: string | null) {
  if (!uri) return false;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return !!info.exists && (info.size ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function fileExists(uri?: string | null, minBytes = 1024) {
  if (!uri) return false;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    // On Android tmp files can come as "content://". Treat those as present.
    if (info.exists && typeof info.size === "number") return info.size >= minBytes;
    return info.exists ?? false;
  } catch {
    return false;
  }
}


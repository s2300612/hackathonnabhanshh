import * as FileSystem from "expo-file-system";

/**
 * Ensure we have a file:// URI that MediaLibrary.createAssetAsync can accept.
 *
 * - If the incoming URI is already file://, return as-is.
 * - If it's a data: URI, decode and write to FileSystem.cacheDirectory and return path.
 * - If it's http(s), download to cache and return path.
 */
export async function ensureFileUri(u: string): Promise<string> {
  if (!u) throw new Error("ensureFileUri: missing uri");

  if (u.startsWith("file://")) return u;

  // Try to get base directory - use legacy API if new API doesn't have it
  let base: string | null = null;
  try {
    // @ts-expect-error - cacheDirectory/documentDirectory may not exist in new API
    base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? null;
  } catch {
    // New API might not have these properties
  }
  if (!base) {
    try {
      const legacyFS = await import("expo-file-system/legacy");
      // @ts-expect-error - legacy API may have different structure
      base = legacyFS.cacheDirectory ?? legacyFS.documentDirectory ?? null;
    } catch {
      // Legacy API might also fail
    }
  }
  if (!base) {
    throw new Error("ensureFileUri: no writable directory available");
  }

  const dest = `${base}export-${Date.now()}.jpg`;

  try {
    // Handle data: URI
    if (u.startsWith("data:")) {
      const base64Match = u.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (!base64Match || !base64Match[1]) {
        throw new Error("Invalid data URI format");
      }
      const base64 = base64Match[1];
      const { writeAsStringAsync, EncodingType } = await import("expo-file-system/legacy");
      await writeAsStringAsync(dest, base64, { encoding: EncodingType.Base64 });
      return dest.startsWith("file://") ? dest : `file://${dest}`;
    }

    // Handle http(s) URI
    if (u.startsWith("http://") || u.startsWith("https://")) {
      const { downloadAsync } = await import("expo-file-system");
      const result = await downloadAsync(u, dest);
      return result.uri;
    }

    // For other URIs, try to copy
    const { copyAsync } = await import("expo-file-system/legacy");
    await copyAsync({ from: u, to: dest });
    return dest.startsWith("file://") ? dest : `file://${dest}`;
  } catch (e) {
    console.warn("[ensureFileUri] failed to normalize uri", u, e);
    throw e;
  }
}



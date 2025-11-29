import * as FileSystem from 'expo-file-system';

// Get writable directory dynamically (may be undefined in Expo Go)
async function getWritableDir(): Promise<string> {
  // Try new API first
  let root = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  
  // If new API doesn't have it, try legacy API
  if (!root) {
    try {
      const legacyFS = await import('expo-file-system/legacy');
      // @ts-expect-error - legacy API may have different structure
      root = legacyFS.cacheDirectory ?? legacyFS.documentDirectory;
    } catch {
      // Legacy API might also fail
    }
  }
  
  // If still no root, try to extract from a known writable location (Camera directory)
  if (!root) {
    // Camera directory is typically writable in Expo Go
    root = '/data/user/0/host.exp.exponent/cache/Camera/';
  }
  
  return root || '';
}

export async function ensureCacheDir() {
  const root = await getWritableDir();
  const dir = `${root}camplus/`;
  try {
    // Use legacy API to avoid deprecation warnings
    const { makeDirectoryAsync } = await import('expo-file-system/legacy');
    await makeDirectoryAsync(dir, { intermediates: true });
  } catch {
    // Directory may already exist
  }
  return dir;
}

export async function persistTemp(uri: string): Promise<string> {
  // Normalize + copy any temp file (e.g., ViewShot "ReactNative-snapshot-image...") to a stable app path
  if (!uri) throw new Error("persistTemp: missing uri");
  
  // First verify the source file exists
  const sourceExists = await fileExists(uri);
  if (!sourceExists) {
    console.warn('[FS] persistTemp: source file does not exist:', uri);
    throw new Error(`Source file does not exist: ${uri}`);
  }
  
  // Always use Camera directory - it's writable and persistent (don't use temp directories)
  const destDir = 'file:///data/user/0/host.exp.exponent/cache/Camera/';
  console.log('[FS] persistTemp: Using Camera directory for persistent storage:', destDir);
  
  // Extract filename from source URI (decode if needed, handle double encoding)
  let filename = uri.split("/").pop() || `snap-${Date.now()}.jpg`;
  // Try to decode (might be double-encoded)
  try {
    filename = decodeURIComponent(filename);
    // If it still has encoded characters, decode again
    if (filename.includes('%')) {
      filename = decodeURIComponent(filename);
    }
  } catch {
    // If decoding fails, use as-is
  }
  // Remove any special characters from filename and ensure .jpg extension
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.(jpg|jpeg|png)$/i, '') + '.jpg';
  const dest = `${destDir}${Date.now()}-${cleanFilename}`;
  console.log('[FS] persistTemp: Source:', uri.substring(0, 100), 'Dest:', dest);
  
  try {
    // Use legacy API to avoid deprecation warnings
    const { copyAsync } = await import('expo-file-system/legacy');
    await copyAsync({ from: uri, to: dest });
    // Verify the copy succeeded
    const destExists = await fileExists(dest);
    if (!destExists) {
      throw new Error('Copy succeeded but destination file does not exist');
    }
    console.log('[FS] persistTemp: successfully copied to:', dest);
    return dest;
  } catch (e) {
    console.warn('[FS] persistTemp: copyAsync failed, trying read/write as base64:', e);
    // If copy fails, try read/write as base64
    try {
      const { readAsStringAsync, writeAsStringAsync, EncodingType } = await import('expo-file-system/legacy');
      const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
      await writeAsStringAsync(dest, base64, { encoding: EncodingType.Base64 });
      // Verify the write succeeded
      const destExists = await fileExists(dest);
      if (!destExists) {
        throw new Error('Write succeeded but destination file does not exist');
      }
      console.log('[FS] persistTemp: successfully wrote base64 to:', dest);
      return dest;
    } catch (e2) {
      console.error('[FS] persistTemp: all methods failed:', e2);
      // Don't return the original URI - it's a temp file that will be deleted
      throw new Error(`Failed to persist temp file: ${uri}. Original error: ${e2}`);
    }
  }
}

export async function fileExists(uri: string): Promise<boolean> {
  if (!uri) return false;
  try {
    // Use legacy API
    const { getInfoAsync } = await import('expo-file-system/legacy');
    const info = await getInfoAsync(uri);
    return !!info.exists && (info.size ?? 1) > 0;
  } catch {
    return false;
  }
}

export { FileSystem };

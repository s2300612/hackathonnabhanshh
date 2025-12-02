import * as FileSystem from 'expo-file-system';

async function getWritableDir(): Promise<string> {
  let root = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  
  if (!root) {
    try {
      const legacyFS = await import('expo-file-system/legacy');
      // @ts-expect-error - legacy API may have different structure
      root = legacyFS.cacheDirectory ?? legacyFS.documentDirectory;
    } catch {
    }
  }
  
  if (!root) {
    root = '/data/user/0/host.exp.exponent/cache/Camera/';
  }
  
  return root || '';
}

export async function ensureCacheDir() {
  const root = await getWritableDir();
  const dir = `${root}camplus/`;
  try {
    const { makeDirectoryAsync } = await import('expo-file-system/legacy');
    await makeDirectoryAsync(dir, { intermediates: true });
  } catch {
  }
  return dir;
}

export async function persistTemp(uri: string): Promise<string> {
  if (!uri) throw new Error("persistTemp: missing uri");
  
  const sourceExists = await fileExists(uri);
  if (!sourceExists) {
    console.warn('[FS] persistTemp: source file does not exist:', uri);
    throw new Error(`Source file does not exist: ${uri}`);
  }
  
  const destDir = 'file:///data/user/0/host.exp.exponent/cache/Camera/';
  console.log('[FS] persistTemp: Using Camera directory for persistent storage:', destDir);
  
  let filename = uri.split("/").pop() || `snap-${Date.now()}.jpg`;
  try {
    filename = decodeURIComponent(filename);
    if (filename.includes('%')) {
      filename = decodeURIComponent(filename);
    }
  } catch {
  }
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.(jpg|jpeg|png)$/i, '') + '.jpg';
  const dest = `${destDir}${Date.now()}-${cleanFilename}`;
  console.log('[FS] persistTemp: Source:', uri.substring(0, 100), 'Dest:', dest);
  
  try {
    const { copyAsync } = await import('expo-file-system/legacy');
    await copyAsync({ from: uri, to: dest });
    const destExists = await fileExists(dest);
    if (!destExists) {
      throw new Error('Copy succeeded but destination file does not exist');
    }
    console.log('[FS] persistTemp: successfully copied to:', dest);
    return dest;
  } catch (e) {
    console.warn('[FS] persistTemp: copyAsync failed, trying read/write as base64:', e);
    try {
      const { readAsStringAsync, writeAsStringAsync, EncodingType } = await import('expo-file-system/legacy');
      const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
      await writeAsStringAsync(dest, base64, { encoding: EncodingType.Base64 });
      const destExists = await fileExists(dest);
      if (!destExists) {
        throw new Error('Write succeeded but destination file does not exist');
      }
      console.log('[FS] persistTemp: successfully wrote base64 to:', dest);
      return dest;
    } catch (e2) {
      console.error('[FS] persistTemp: all methods failed:', e2);
      throw new Error(`Failed to persist temp file: ${uri}. Original error: ${e2}`);
    }
  }
}

export async function fileExists(uri: string): Promise<boolean> {
  if (!uri) return false;
  try {
    const { getInfoAsync } = await import('expo-file-system/legacy');
    const info = await getInfoAsync(uri);
    return !!info.exists && (info.size ?? 1) > 0;
  } catch {
    return false;
  }
}

export { FileSystem };

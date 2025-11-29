// Wrapper around AsyncStorage that suppresses "Row too big" errors
import AsyncStorage from "@react-native-async-storage/async-storage";

function isRowTooBigError(error: any): boolean {
  const message = error?.message || String(error || '');
  return message.includes('Row too big') || message.includes('CursorWindow');
}

// Create a safe storage wrapper that suppresses "Row too big" errors
export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      if (isRowTooBigError(error)) {
        // Silently suppress "Row too big" errors - return null to indicate no data
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      if (isRowTooBigError(error)) {
        // Silently suppress "Row too big" errors - data is too large to store
        return;
      }
      // Re-throw other errors
      throw error;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      if (isRowTooBigError(error)) {
        // Silently suppress "Row too big" errors
        return;
      }
      // Re-throw other errors
      throw error;
    }
  },

  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      if (isRowTooBigError(error)) {
        // Silently suppress "Row too big" errors - return empty results
        return keys.map(key => [key, null]);
      }
      // Re-throw other errors
      throw error;
    }
  },

  multiSet: async (entries: [string, string][]): Promise<void> => {
    try {
      await AsyncStorage.multiSet(entries);
    } catch (error) {
      if (isRowTooBigError(error)) {
        // Silently suppress "Row too big" errors - data is too large to store
        return;
      }
      // Re-throw other errors
      throw error;
    }
  },

  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      if (isRowTooBigError(error)) {
        // Silently suppress "Row too big" errors
        return;
      }
      // Re-throw other errors
      throw error;
    }
  },

  getAllKeys: async (): Promise<string[]> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      if (isRowTooBigError(error)) {
        // Silently suppress "Row too big" errors - return empty array
        return [];
      }
      // Re-throw other errors
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      if (isRowTooBigError(error)) {
        // Silently suppress "Row too big" errors
        return;
      }
      // Re-throw other errors
      throw error;
    }
  },
};


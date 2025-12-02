import AsyncStorage from "@react-native-async-storage/async-storage";

function isRowTooBigError(error: any): boolean {
  const message = error?.message || String(error || '');
  return message.includes('Row too big') || message.includes('CursorWindow');
}
// The safe storage makes it safe by wrapping AsyncStorage to stop any errors from Rows being too big.
export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      if (isRowTooBigError(error)) {
        return null;
      }
      throw error;
    }
  },
// Also makes `setItem()`, `removeItem()`, `multiSet()`, `multiRemove()`, `clear()` fail when rows are too big.
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      if (isRowTooBigError(error)) {
        return;
      }
      throw error;
    }
  },
// prevents app crashes also when the AsyncStorage finds data that exceeds sizes allowed by the database.
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      if (isRowTooBigError(error)) {
        return;
      }
      throw error;
    }
  },

  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      if (isRowTooBigError(error)) {
        return keys.map(key => [key, null]);
      }
      throw error;
    }
  },

  multiSet: async (entries: [string, string][]): Promise<void> => {
    try {
      await AsyncStorage.multiSet(entries);
    } catch (error) {
      if (isRowTooBigError(error)) {
        return;
      }
      throw error;
    }
  },

  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      if (isRowTooBigError(error)) {
        return;
      }
      throw error;
    }
  },

  getAllKeys: async (): Promise<string[]> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      if (isRowTooBigError(error)) {
        return [];
      }
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      if (isRowTooBigError(error)) {
        return;
      }
      throw error;
    }
  },
};


import AsyncStorage from "@react-native-async-storage/async-storage";

function isRowTooBigError(error: any): boolean {
  const message = error?.message || String(error || '');
  return message.includes('Row too big') || message.includes('CursorWindow');
}

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


import AsyncStorage from "@react-native-async-storage/async-storage";
import create from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export type UserProfile = {
  nickname: string;
  atoll: string;
  deviceId: string;
};

type UserState = {
  hydrated: boolean;
  profile?: UserProfile;
  setProfile: (nickname: string, atoll: string) => void;
  clearProfile: () => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      profile: undefined,
      setProfile: (nickname, atoll) => {
        const existing = get().profile?.deviceId ?? uuidv4();
        set({ profile: { nickname, atoll, deviceId: existing } });
      },
      clearProfile: () => set({ profile: undefined }),
    }),
    {
      name: "sirru-user",
      getStorage: () => AsyncStorage,
      onRehydrateStorage: () => (state) => {
        if (state?.profile && !state.profile.deviceId) {
          const profile = state.profile;
          state.profile = { ...profile, deviceId: uuidv4() };
        }
        // Set hydrated flag directly on the state object
        if (state) {
          state.hydrated = true;
        }
      },
      version: 1,
    }
  )
);

// helper hook to expose hydration flag in a predictable way
export const useUserHydrated = () => {
  const hydrated = useUserStore((s) => s.hydrated);
  return hydrated;
};


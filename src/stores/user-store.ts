import AsyncStorage from "@react-native-async-storage/async-storage";
import create from "zustand";
import { persist } from "zustand/middleware";
import { makeId } from "@/lib/make-id";

export type UserProfile = {
  nickname: string;
  atoll: string;
  deviceId: string;
};

export type KoamasConfig = {
  apiBaseUrl: string;
  modelName: string;
};

type UserState = {
  profile?: UserProfile;
  hasOnboarded: boolean;
  koamasConfig: KoamasConfig;
  setProfile: (nickname: string, atoll: string) => void;
  setNickname: (nickname: string) => void;
  setHasOnboarded: (value: boolean) => void;
  clearProfile: () => void;
  setKoamasConfig: (cfg: Partial<KoamasConfig>) => void;
  clearAll: () => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: undefined,
      hasOnboarded: false,
      koamasConfig: {
        apiBaseUrl: "https://api.example.com/koamas",
        modelName: "claude-sonnet-4",
      },
      setProfile: (nickname, atoll) => {
        const existing = get().profile?.deviceId ?? makeId();
        set({ profile: { nickname, atoll, deviceId: existing } });
      },
      setNickname: (nickname) => {
        const existing = get().profile;
        if (existing) {
          set({ profile: { ...existing, nickname } });
        }
      },
      setHasOnboarded: (value) => set({ hasOnboarded: value }),
      clearProfile: () => set({ profile: undefined }),
      setKoamasConfig: (cfg) =>
        set({ koamasConfig: { ...get().koamasConfig, ...cfg } }),
      clearAll: () =>
        set({
          profile: undefined,
          hasOnboarded: false, // Important: reset onboarding flag
          // Keep koamasConfig when clearing user data
          koamasConfig: get().koamasConfig,
        }),
    }),
    {
      name: "sirru-user",
      getStorage: () => AsyncStorage,
      onRehydrateStorage: () => {
        // Return a callback that runs after rehydration
        return (state, error) => {
          if (error) {
            console.error("Error rehydrating store:", error);
            return;
          }
          
          // Ensure deviceId exists for existing profiles
          if (state?.profile && !state.profile.deviceId) {
            // Update the profile with deviceId using setState
            useUserStore.setState({
              profile: { ...state.profile, deviceId: makeId() },
            });
          }
        };
      },
      version: 1,
    }
  )
);



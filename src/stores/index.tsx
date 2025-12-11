// src/stores/index.tsx
import React, { createContext, useContext } from "react";
import { authStore, useAuth } from "./auth-store";
import { CameraStore } from "./camera-store";
import { historyStore } from "./history-store";
import { useUserStore } from "./user-store";
import { useCheckinStore } from "./checkin-store";

const cameraStore = new CameraStore();

const StoresContext = createContext({
  auth: authStore,
  camera: cameraStore,
  history: historyStore,
  user: useUserStore,
  checkins: useCheckinStore,
});

export const StoresProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <StoresContext.Provider
    value={{ auth: authStore, camera: cameraStore, history: historyStore, user: useUserStore, checkins: useCheckinStore }}
  >
    {children}
  </StoresContext.Provider>
);

export const useStores = () => useContext(StoresContext);

export type { EditEntry, HistoryItem, EffectKind } from "./history-store";

// Re-export auth utilities
export { authStore, useAuth, cameraStore, useUserStore, useCheckinStore };

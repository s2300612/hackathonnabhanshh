// src/stores/index.tsx
import React, { createContext, useContext } from "react";
import { authStore, useAuth } from "./auth-store";
import { CameraStore } from "./camera-store";
import { historyStore } from "./history-store";

const cameraStore = new CameraStore();

const StoresContext = createContext({ auth: authStore, camera: cameraStore, history: historyStore });

export const StoresProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <StoresContext.Provider value={{ auth: authStore, camera: cameraStore, history: historyStore }}>
    {children}
  </StoresContext.Provider>
);

export const useStores = () => useContext(StoresContext);

export type { EditEntry, HistoryItem, EffectKind } from "./history-store";

// Re-export auth utilities
export { authStore, useAuth };

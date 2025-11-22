import React, { createContext, useContext } from "react";

import { CameraStore } from "./camera-store";

import { historyStore, HistoryStore } from "./history-store";



type RootStores = {

  camera: CameraStore;

  history: HistoryStore;

};



export const stores: RootStores = {

  camera: new CameraStore(),

  history: historyStore,

};



const StoresContext = createContext(stores);

export const useStores = () => useContext(StoresContext);



export default function StoresProvider({ children }: { children: React.ReactNode }) {

  return (

    <StoresContext.Provider value={stores}>

      {children}

    </StoresContext.Provider>

  );

}



export type { EditEntry, HistoryItem, EffectKind } from "./history-store";



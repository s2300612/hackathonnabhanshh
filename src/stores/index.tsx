import React from "react";

import { CameraStore } from "./camera-store";

export const stores = {

  camera: new CameraStore(),

};

const StoresContext = React.createContext(stores);

export const useStores = () => React.useContext(StoresContext);

export default function StoresProvider({ children }: { children: React.ReactNode }) {

  return (

    <StoresContext.Provider value={stores}>

      {children}

    </StoresContext.Provider>

  );

}


import { makeAutoObservable } from "mobx";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { makePersistable } from "mobx-persist-store";



export type Look = "none" | "night" | "thermal" | "tint";

export type Shot = {
  id: string;
  uri: string;          // original source
  bakedUri?: string;    // baked effect (if available)
  look?: Look;
  tint?: string;
  alpha?: number;
  createdAt: number;
};



export class CameraStore {

  // UI / editor prefs

  look: Look = "none";

  tint = "#22c55e";

  night = 0.28;

  thermal = 0.28;

  tintAlpha = 0.35;



  // Captures the app keeps locally (deduped by uri)

  recent: Shot[] = [];



  constructor() {

    makeAutoObservable(this);

    makePersistable(this, {

      name: "CameraStore.v1",

      properties: ["look", "tint", "night", "thermal", "tintAlpha", "recent"],

      storage: AsyncStorage,

      stringify: true,

    });

  }



  setLook(v: Look) { this.look = v; }

  setTint(v: string) { this.tint = v; }

  setNight(v: number) { this.night = v; }

  setThermal(v: number) { this.thermal = v; }

  setTintAlpha(v: number) { this.tintAlpha = v; }



  pushLocal(payload: { uri: string; bakedUri?: string; look?: Look; tint?: string; alpha?: number; createdAt?: number }) {
    const { uri, bakedUri, look, tint, alpha, createdAt } = payload;
    if (!uri) return null;
    
    // Don't store data URIs in AsyncStorage - they're too large
    // Data URIs will be passed via params instead
    const isDataUri = bakedUri?.startsWith('data:');
    const storedBakedUri = isDataUri ? undefined : bakedUri;
    
    const exists = this.recent.some(s => s.uri === uri && (!storedBakedUri || s.bakedUri === storedBakedUri));
    if (exists) return null;
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const shot: Shot = {
      id,
      uri,
      bakedUri: storedBakedUri || undefined, // only store file URIs, not data URIs
      look,
      tint,
      alpha,
      createdAt: createdAt ?? Date.now(),
    };
    // Limit to 50 items to prevent AsyncStorage "Row too big" errors
    this.recent = [shot, ...this.recent].slice(0, 50);
    
    // If bakedUri is a data URI, return it in the shot but it won't be persisted
    // The caller should pass it via params instead
    if (isDataUri && bakedUri) {
      return { ...shot, bakedUri };
    }
    
    return shot;
  }



  removeShot(id: string) {

    this.recent = this.recent.filter(s => s.id !== id);

  }



  clearShots() { this.recent = []; }

  removeLocalByUri = async (uri: string) => {
    this.recent = this.recent.filter(it => it.uri !== uri && it.bakedUri !== uri);
    // Persistence is handled automatically by makePersistable
  };

  clearLocal = async () => {
    this.recent = [];
    // Persistence is handled automatically by makePersistable
  };

}


import { makeAutoObservable } from "mobx";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { makePersistable } from "mobx-persist-store";



export type Look = "none" | "night" | "thermal" | "tint";

export type Shot = { id: string; uri: string };



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



  pushShot(uri: string) {

    if (!uri) return;

    const exists = this.recent.some(s => s.uri === uri);

    if (exists) return;

    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // keep last 100

    this.recent = [{ id, uri }, ...this.recent].slice(0, 100);

  }



  removeShot(id: string) {

    this.recent = this.recent.filter(s => s.id !== id);

  }



  clearShots() { this.recent = []; }

  removeLocalByUri = async (uri: string) => {
    this.recent = this.recent.filter(it => it.uri !== uri);
    // Persistence is handled automatically by makePersistable
  };

  clearLocal = async () => {
    this.recent = [];
    // Persistence is handled automatically by makePersistable
  };

}


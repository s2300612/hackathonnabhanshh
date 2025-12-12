import create from "zustand";
import { makeId } from "@/lib/make-id";
import { useUserStore } from "./user-store";
import { getAtollCoords } from "@/lib/atoll-coords";

export type Mood = "sunny" | "stormy";

export type Pulse = {
  id: string;
  atoll: string;
  mood: Mood;
  createdAt: string;
  lat: number;
  lng: number;
  note?: string;
  mine?: boolean;
};

type CheckinState = {
  pulses: Pulse[];
  addCheckin: (mood: Mood, note?: string) => void;
  seedIfEmpty: () => void;
};

const defaultSeeds: Pulse[] = [
  { id: makeId(), atoll: "K", mood: "stormy", createdAt: new Date().toISOString(), ...getAtollCoords("K") },
  { id: makeId(), atoll: "S", mood: "sunny", createdAt: new Date().toISOString(), ...getAtollCoords("S") },
  { id: makeId(), atoll: "GA", mood: "stormy", createdAt: new Date().toISOString(), ...getAtollCoords("GA") },
  { id: makeId(), atoll: "Lh", mood: "sunny", createdAt: new Date().toISOString(), ...getAtollCoords("Lh") },
];

export const useCheckinStore = create<CheckinState>((set, get) => ({
  pulses: [],
  addCheckin: (mood, note) => {
    const user = useUserStore.getState().profile;
    if (!user) return;
    const now = new Date().toISOString();
    const coords = getAtollCoords(user.atoll);
    const pulse: Pulse = {
      id: makeId(),
      atoll: user.atoll,
      mood,
      createdAt: now,
      lat: coords.lat,
      lng: coords.lng,
      note,
      mine: true,
    };
    set((state) => ({
      pulses: [pulse, ...state.pulses].slice(0, 200),
    }));
  },
  seedIfEmpty: () => {
    if (get().pulses.length === 0) {
      set({ pulses: defaultSeeds });
    }
  },
}));


import create from "zustand";
import { v4 as uuidv4 } from "uuid";
import { useUserStore } from "./user-store";

export type Mood = "sunny" | "stormy";

export type Pulse = {
  id: string;
  atoll: string;
  mood: Mood;
  createdAt: string;
  note?: string;
  mine?: boolean;
};

type CheckinState = {
  pulses: Pulse[];
  addCheckin: (mood: Mood, note?: string) => void;
  seedIfEmpty: () => void;
};

const defaultSeeds: Pulse[] = [
  { id: uuidv4(), atoll: "K", mood: "stormy", createdAt: new Date().toISOString() },
  { id: uuidv4(), atoll: "S", mood: "sunny", createdAt: new Date().toISOString() },
  { id: uuidv4(), atoll: "GA", mood: "stormy", createdAt: new Date().toISOString() },
  { id: uuidv4(), atoll: "Lh", mood: "sunny", createdAt: new Date().toISOString() },
];

export const useCheckinStore = create<CheckinState>((set, get) => ({
  pulses: [],
  addCheckin: (mood, note) => {
    const user = useUserStore.getState().profile;
    if (!user) return;
    const now = new Date().toISOString();
    const pulse: Pulse = {
      id: uuidv4(),
      atoll: user.atoll,
      mood,
      createdAt: now,
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


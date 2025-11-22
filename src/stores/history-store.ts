// must be first – polyfills crypto.getRandomValues for Hermes
import "react-native-get-random-values";
import { makeAutoObservable, computed, runInAction } from "mobx";
import { makePersistable } from "mobx-persist-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuid } from "uuid";

export type EffectKind = "none" | "night" | "thermal" | "tint";

export type EditEntry = {
  id: string; // uuid v4
  sourceUri: string;
  effect: EffectKind;
  tintHex?: string;
  strength: number; // 0..1
  exportedUri?: string;
  status: "draft" | "exported";
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "camera.history.v2";
const cap = 100;

export class HistoryStore {
  recentEdits: EditEntry[] = [];
  filter: "all" | "drafts" | "exported" = "all";
  sort: "newest" | "oldest" = "newest";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    makePersistable(this, {
      name: "HistoryStore",
      properties: ["recentEdits", "filter", "sort"],
      storage: AsyncStorage,
      stringify: true,
    });
  }

  // Computed: filtered and sorted edits
  get filteredSortedEdits(): EditEntry[] {
    let filtered = this.recentEdits;
    
    if (this.filter === "drafts") {
      filtered = filtered.filter((e) => e.status === "draft");
    } else if (this.filter === "exported") {
      filtered = filtered.filter((e) => e.status === "exported");
    }

    const sorted = [...filtered].sort((a, b) => {
      if (this.sort === "newest") {
        return b.createdAt - a.createdAt;
      } else {
        return a.createdAt - b.createdAt;
      }
    });

    return sorted;
  }

  // Legacy compatibility: items getter
  get items(): EditEntry[] {
    return this.recentEdits;
  }

  addDraft(entryLike: Omit<EditEntry, "id" | "status" | "createdAt" | "updatedAt">): EditEntry {
    const now = Date.now();
    const id = uuid();
    
    // De-dupe: check if same sourceUri + effect + createdAt bucket (within 1 second)
    const bucket = Math.floor(now / 1000);
    const duplicate = this.recentEdits.find(
      (e) =>
        e.sourceUri === entryLike.sourceUri &&
        e.effect === entryLike.effect &&
        Math.floor(e.createdAt / 1000) === bucket
    );

    if (duplicate) {
      // Update existing instead of creating duplicate
      duplicate.strength = entryLike.strength;
      duplicate.tintHex = entryLike.tintHex;
      duplicate.updatedAt = now;
      return duplicate;
    }

    const entry: EditEntry = {
      id,
      ...entryLike,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    this.recentEdits = [entry, ...this.recentEdits].slice(0, cap);
    return entry;
  }

  markExported(id: string, exportedUri: string) {
    const entry = this.recentEdits.find((e) => e.id === id);
    if (entry) {
      entry.exportedUri = exportedUri;
      entry.status = "exported";
      entry.updatedAt = Date.now();
    }
  }

  deleteEdit(id: string) {
    this.recentEdits = this.recentEdits.filter((e) => e.id !== id);
  }

  clearEdits() {
    this.recentEdits = [];
  }

  setFilter(v: "all" | "drafts" | "exported") {
    this.filter = v;
  }

  setSort(v: "newest" | "oldest") {
    this.sort = v;
  }

  // Legacy compatibility methods
  add(item: Omit<EditEntry, "id" | "status" | "createdAt" | "updatedAt">) {
    return this.addDraft(item);
  }

  remove(id: string) {
    this.deleteEdit(id);
  }

  clear() {
    this.clearEdits();
  }
}

export const historyStore = new HistoryStore();

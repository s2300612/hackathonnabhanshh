// src/stores/auth-store.tsx
import { makeAutoObservable, runInAction } from "mobx";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USERS_KEY = "auth.users.v1";
const SESSION_KEY = "auth.session.v1";

export class AuthStore {
  signedIn = false;
  email: string | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  async init(): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      // Load users map
      const usersRaw = await AsyncStorage.getItem(USERS_KEY);
      // Users map is stored but we don't need to load it into memory
      // We'll read it on-demand during login/register

      // Load session
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw) as { email: string };
        // Verify the user still exists
        const usersRaw2 = await AsyncStorage.getItem(USERS_KEY);
        if (usersRaw2) {
          const users = JSON.parse(usersRaw2) as Record<string, string>;
          if (users[session.email]) {
            runInAction(() => {
              this.signedIn = true;
              this.email = session.email;
            });
          }
        }
      }
    } catch (e: any) {
      runInAction(() => {
        this.error = String(e?.message ?? e);
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  isValidEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  async register(email: string, pass: string): Promise<void> {
    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    try {
      const trimmed = email.trim().toLowerCase();
      if (!this.isValidEmail(trimmed)) {
        throw new Error("Invalid email format.");
      }
      if (pass.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      const usersRaw = await AsyncStorage.getItem(USERS_KEY);
      const users = usersRaw ? (JSON.parse(usersRaw) as Record<string, string>) : {};

      if (users[trimmed]) {
        throw new Error("Email already registered.");
      }

      users[trimmed] = pass;
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Auto-login after registration
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ email: trimmed }));
      runInAction(() => {
        this.signedIn = true;
        this.email = trimmed;
        this.loading = false;
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = String(e?.message ?? e);
        this.loading = false;
      });
      throw e;
    }
  }

  async login(email: string, pass: string): Promise<void> {
    runInAction(() => {
      this.loading = true;
      this.error = null;
    });

    try {
      const trimmed = email.trim().toLowerCase();
      const usersRaw = await AsyncStorage.getItem(USERS_KEY);
      if (!usersRaw) {
        throw new Error("Invalid email or password.");
      }

      const users = JSON.parse(usersRaw) as Record<string, string>;
      if (!users[trimmed] || users[trimmed] !== pass) {
        throw new Error("Invalid email or password.");
      }

      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ email: trimmed }));
      runInAction(() => {
        this.signedIn = true;
        this.email = trimmed;
        this.loading = false;
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = String(e?.message ?? e);
        this.loading = false;
      });
      throw e;
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
    runInAction(() => {
      this.signedIn = false;
      this.email = null;
      this.error = null;
    });
  }
}

export const authStore = new AuthStore();
export function useAuth() {
  return authStore;
}

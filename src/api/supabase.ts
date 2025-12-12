// Import URL polyfill FIRST - must be before any Supabase imports
import "react-native-url-polyfill/auto";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // React Native doesn't use URLs for auth
    },
  });
}

export const supabase = client;


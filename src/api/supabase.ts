import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '../types/db';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Secure token store backed by the Android keystore (never plain AsyncStorage).
const secureStorage = {
  getItem: async (key: string) => {
    const value = await SecureStore.getItemAsync(key);
    return value;
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInLocalStorage: false,
  },
});

export type SupabaseClient = typeof supabase;

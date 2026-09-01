import Constants from 'expo-constants';

const extra = Constants?.expoConfig?.extra ?? (Constants as any)?.manifest?.extra ?? {};

export const SUPABASE_URL: string = (extra?.SUPABASE_URL as string) ?? '';
export const SUPABASE_ANON_KEY: string = (extra?.SUPABASE_ANON_KEY as string) ?? '';
export const API_BASE_URL: string = (extra?.API_BASE_URL as string) ?? '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);

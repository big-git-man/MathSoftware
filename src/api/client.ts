// Thin re-export of the typed Supabase client so services/hook imports read
// `import { supabase } from '@/api/client'`.
export { supabase } from './supabase';
export type { SupabaseClient } from './supabase';
export type { Database } from '../types/db';
export type { Tables, TablesInsert, Enums } from '../types/db';

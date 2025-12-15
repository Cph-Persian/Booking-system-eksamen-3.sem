import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ANON_KEY;
const hasCredentials = supabaseUrl && supabaseAnonKey;

if (!hasCredentials) {
  console.warn('⚠️ Supabase credentials mangler!');
}

export const supabase: SupabaseClient | null = hasCredentials
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

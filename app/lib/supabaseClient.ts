// app/lib/supabaseClient.ts

/**
 * Supabase Client Konfiguration
 * 
 * Denne fil opretter og eksporterer Supabase klienten:
 * - Læser environment variabler fra .env.local
 * - Opretter Supabase klient hvis credentials er tilgængelige
 * - Returnerer null hvis credentials mangler (med warning i console)
 * - Bruges i hele applikationen til database queries og authentication
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ANON_KEY;

// Tjek om variablerne er sat
const hasCredentials = supabaseUrl && supabaseAnonKey;

if (!hasCredentials) {
  console.warn('⚠️ Supabase credentials mangler!');
  console.warn('Opret en .env.local fil i projektets rod med:');
  console.warn('NEXT_PUBLIC_SUPABASE_URL=din-supabase-url');
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=din-supabase-anon-key');
  console.warn('Se .env.local.example for eksempel');
}

// Opret klient kun hvis begge variabler er sat
export const supabase: SupabaseClient | null = hasCredentials
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

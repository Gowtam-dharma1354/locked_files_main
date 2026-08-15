import { createClient } from '@supabase/supabase-js';

// Client-side Supabase instance
// Uses Vite environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// Never include the service role key in client code.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Do not throw here to avoid build-time crashes; runtime checks should surface missing envs.
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Supabase client will be unusable.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export default supabase;

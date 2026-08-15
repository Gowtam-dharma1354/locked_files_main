import { createClient } from '@supabase/supabase-js';

export function createAdminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server environment');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

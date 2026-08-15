// Server-side Supabase helper (example)
// Use in Vercel Serverless Functions or API routes only.
// Store your service role key in Vercel environment variables (not in code).

import { createClient } from '@supabase/supabase-js';

// Example usage in a server function:
// const supabaseAdmin = createServerSupabase();
// await supabaseAdmin.from('competition_sessions').insert(...)

export function createServerSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server environment');
  }

  return createClient(url, serviceRoleKey, {
    // keep default options; ensure you only call this server-side
  });
}

// Note: Do NOT deploy any server code that leaks the service role key to the browser.

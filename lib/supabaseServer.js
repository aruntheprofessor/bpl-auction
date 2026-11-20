// Database connection used ONLY on the server (it can write). Never import this in a screen.
import { createClient } from '@supabase/supabase-js';

export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server keys are missing. Check your .env.local file.');
  return createClient(url, key, { auth: { persistSession: false } });
}

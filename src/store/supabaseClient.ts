import { createClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const isConfigured = Boolean(configuredUrl && configuredAnonKey);

if (!isConfigured) {
  console.warn(
    '[Fear Archive] Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

// Valid placeholders keep the static bundle renderable before deployment is
// configured. Requests will fail normally and are surfaced by the data layer.
export const supabase = createClient(
  configuredUrl || 'https://missing-config.supabase.co',
  configuredAnonKey || 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const isSupabaseConfigured = isConfigured;

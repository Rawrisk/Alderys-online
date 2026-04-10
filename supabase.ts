import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));

if (!isSupabaseConfigured) {
  console.warn('Supabase configuration is missing or invalid. Multiplayer and database features will be disabled.');
  console.warn('To enable these features, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

// Only create a real client if configured, otherwise use a proxy that doesn't throw but doesn't connect
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder-url.supabase.co', 'placeholder-key', {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 0 } }
    });

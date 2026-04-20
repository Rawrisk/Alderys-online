import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = (val: string | undefined) => {
  if (!val) return true;
  const v = val.toLowerCase();
  return v.includes('placeholder') || v.includes('your-project') || v.includes('todo') || v.includes('key-here') || v.length < 10;
};

export const checkIsConfigured = (url: string, key: string) => {
  return Boolean(
    url && 
    key && 
    url.startsWith('https://') && 
    !isPlaceholder(url) && 
    !isPlaceholder(key)
  );
};

export let isSupabaseConfigured = checkIsConfigured(supabaseUrl, supabaseAnonKey);

// Initial client
export let supabase: SupabaseClient = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder-url.supabase.co', 'placeholder-key', {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 0 } }
    });

// Listeners for config changes
const listeners: ((configured: boolean) => void)[] = [];

// Helper to update the client at runtime if config is fetched from server
export const updateSupabaseConfig = (url: string, key: string) => {
  if (checkIsConfigured(url, key)) {
    console.log('Supabase: Updating config with fetched values...');
    supabaseUrl = url;
    supabaseAnonKey = key;
    isSupabaseConfigured = true;
    
    // Explicitly re-create the client with new credentials
    supabase = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 10 } }
    });
    
    listeners.forEach(l => l(true));
    return true;
  }
  return false;
};

// Function to test the connection specifically
export const testSupabaseConnection = async () => {
  console.log('Running Supabase Diagnostics...');
  console.log('Project URL:', supabaseUrl);
  console.log('Key Length:', supabaseAnonKey.length);
  console.log('Key Preview:', supabaseAnonKey.substring(0, 10) + '...');

  if (!isSupabaseConfigured) return { success: false, message: 'Supabase not configured. The URL or Key is missing or too short.' };
  
  // Format check
  if (!supabaseAnonKey.startsWith('eyJ')) {
    return { 
      success: false, 
      message: `INVALID KEY FORMAT: Key starts with "${supabaseAnonKey.substring(0, 5)}". It should start with "eyJ". Please check your Secrets menu for VITE_SUPABASE_ANON_KEY.` 
    };
  }

  try {
    // Test database access
    console.log('Testing Database access (leaderboard table)...');
    const { data: dbData, error: dbError } = await supabase.from('leaderboard').select('count', { count: 'exact', head: true });
    
    // Test Realtime connection
    console.log('Testing Realtime connection...');
    const testChannel = supabase.channel('diag-test');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        testChannel.unsubscribe();
        if (dbError) {
           if (dbError.code === 'PGRST116' || dbError.message.includes('not found')) {
             resolve({ success: true, message: 'Connected! Database responded, but "leaderboard" table is missing. Realtime timed out but might still work.' });
           } else {
             resolve({ success: false, message: `Database error: ${dbError.message}. Realtime also timed out.` });
           }
        } else {
          resolve({ success: true, message: 'Database connection SUCCESS. Realtime check timed out (normal if project is just waking up).' });
        }
      }, 3000);

      testChannel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          testChannel.unsubscribe();
          resolve({ success: true, message: 'PERFECT: Both Database and Realtime are working correctly!' });
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          testChannel.unsubscribe();
          resolve({ 
            success: false, 
            message: `CHANNEL_ERROR: Realtime is rejected. Reason: ${err?.message || 'Check if Realtime is enabled in Supabase Dashboard -> Database -> Publications'}` 
          });
        }
      });
    });
  } catch (err: any) {
    return { success: false, message: `Panic error: ${err.message}` };
  }
};

// Hook for React components to respond to Supabase configuration
export const useSupabaseConfig = () => {
  const [configured, setConfigured] = useState(isSupabaseConfigured);

  useEffect(() => {
    const listener = (val: boolean) => setConfigured(val);
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return configured;
};

// Auto-fetch config from server if not set via environment variables at build time
if (!isSupabaseConfigured && typeof window !== 'undefined') {
  fetch('/api/supabase-config')
    .then(res => res.json())
    .then(data => {
      if (data.url && data.anonKey) {
        if (updateSupabaseConfig(data.url, data.anonKey)) {
          console.log('Supabase configured via server-side secrets.');
        }
      }
    })
    .catch(err => console.error('Failed to fetch Supabase config from server:', err));
}

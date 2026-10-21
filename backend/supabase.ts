import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseServerConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    !supabaseUrl.includes('your-project-id')
  );
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!isSupabaseServerConfigured()) {
    throw new Error(
      'Supabase is not configured. Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment / .env file.'
    );
  }
  return createClient(supabaseUrl!, supabaseKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Singleton instance for server operations
let _client: SupabaseClient | null = null;
export const supabase = {
  get client(): SupabaseClient {
    if (!_client) {
      _client = getSupabaseClient();
    }
    return _client;
  }
};

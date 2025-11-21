import { createBrowserClient } from '@supabase/ssr';
import { createFallbackClient, warnMissingSupabaseEnv } from './fallbackClient';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    warnMissingSupabaseEnv();
    return createFallbackClient();
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

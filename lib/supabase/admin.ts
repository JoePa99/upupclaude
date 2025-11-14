import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Admin client using service_role key - bypasses RLS
// Only use this in API routes for privileged operations!
export function createAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

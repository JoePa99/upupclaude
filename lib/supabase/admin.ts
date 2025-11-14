import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Admin client using service_role key - bypasses RLS
// Only use this in API routes for privileged operations!
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-admin-client',
        },
      },
    }
  );
}

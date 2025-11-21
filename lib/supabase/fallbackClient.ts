import type { SupabaseClient } from '@supabase/supabase-js';

const missingEnvError = new Error(
  'Supabase environment variables are not configured.'
);

const asyncErrorResult = Promise.resolve({ data: null, error: missingEnvError });

function createQueryStub(): any {
  const builder: any = {
    select: () => asyncErrorResult,
    insert: () => asyncErrorResult,
    update: () => asyncErrorResult,
    upsert: () => asyncErrorResult,
    delete: () => asyncErrorResult,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    order: () => builder,
    range: () => builder,
    single: () => asyncErrorResult,
    maybeSingle: () => asyncErrorResult,
    limit: () => builder,
  };

  return builder;
}

export function createFallbackClient(): SupabaseClient<any, any, any> {
  const queryStub = createQueryStub();

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: missingEnvError }),
      signInWithPassword: async () => ({ data: null, error: missingEnvError }),
      signUp: async () => ({ data: null, error: missingEnvError }),
      signOut: async () => ({ error: missingEnvError }),
    },
    from: () => queryStub,
    storage: {
      from: () => ({
        upload: async () => asyncErrorResult,
        download: async () => asyncErrorResult,
        remove: async () => asyncErrorResult,
      }),
    },
  } as unknown as SupabaseClient<any, any, any>;
}

export function warnMissingSupabaseEnv() {
  console.warn(
    'Supabase environment variables are missing. Using fallback client with no-op queries.'
  );
}

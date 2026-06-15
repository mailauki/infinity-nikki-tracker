import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { Database } from '../types/supabase'

/**
 * Cookie-free Supabase client for public, unauthenticated reads. Safe to call
 * inside `use cache` functions, which forbid `cookies()` (so the cookie-based
 * server client cannot be used there). Use only for RLS-public lookup data
 * (categories, colors, trials) — it carries no user session.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

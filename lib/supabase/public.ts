import { createClient } from '@supabase/supabase-js'

import { Database } from '../types/supabase'

/**
 * Cookie-free Supabase client for public, read-only queries.
 * Safe to use inside `use cache` functions (no dynamic APIs).
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

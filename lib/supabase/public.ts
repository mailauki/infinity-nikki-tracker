import { createClient } from '@supabase/supabase-js'

import { Database } from '../types/supabase'

/**
 * Cookie-free Supabase client for public, read-only queries.
 * Singleton instantiated at module load time — safe to use inside `use cache` functions.
 */
export const publicClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

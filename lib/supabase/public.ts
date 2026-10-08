import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// Cookie-free, anonymous client for public data inside `use cache` functions,
// where `cookies()` is not allowed. Sees exactly what a logged-out visitor sees.
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } }
  )
}

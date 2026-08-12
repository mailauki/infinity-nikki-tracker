'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FeedbackStatus } from '@/lib/types/feedback'

// Mutations must NOT be wrapped in React cache() — a cached mutation silently
// no-ops when called twice with the same arguments.
export async function updateFeedbackRow(
  id: string,
  patch: { status?: FeedbackStatus; admin_notes?: string | null }
) {
  const supabase = await createClient()
  const { error } = await supabase.from('feedback').update(patch).eq('id', id)

  if (error) {
    console.error(`Failed to update feedback ${id}:`, error)
    return { error: error.message }
  }

  revalidatePath('/admin/feedback')
  return { error: null }
}

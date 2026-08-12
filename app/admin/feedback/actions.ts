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

export async function deleteFeedbackRow(id: string) {
  const supabase = await createClient()

  // Deleting the row cascades feedback_images, but storage objects are not
  // covered by the FK — remove them explicitly or they orphan in the bucket.
  const { data: images } = await supabase
    .from('feedback_images')
    .select('path')
    .eq('feedback_id', id)

  if (images && images.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('feedback')
      .remove(images.map((image) => image.path))
    if (storageError) console.error(`Failed to remove screenshots for ${id}:`, storageError)
  }

  const { error } = await supabase.from('feedback').delete().eq('id', id)
  if (error) {
    console.error(`Failed to delete feedback ${id}:`, error)
    return { error: error.message }
  }

  revalidatePath('/admin/feedback')
  return { error: null }
}

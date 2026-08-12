import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Feedback } from '@/lib/types/feedback'

// React cache(), not `use cache`: these read auth cookies via createClient(),
// which `use cache` forbids.
export const getFeedback = cache(async (): Promise<Feedback[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load feedback:', error)
    return []
  }
  return data ?? []
})

export const getFeedbackById = cache(async (id: string): Promise<Feedback | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('feedback').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error(`Failed to load feedback ${id}:`, error)
    return null
  }
  return data
})

// The bucket is private, so screenshots are only reachable through short-lived
// signed URLs generated per admin view.
export const getFeedbackImageUrls = cache(async (id: string): Promise<string[]> => {
  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from('feedback_images')
    .select('path')
    .eq('feedback_id', id)
    .order('path')

  if (error || !rows) {
    console.error(`Failed to load images for feedback ${id}:`, error)
    return []
  }

  const urls = await Promise.all(
    rows.map(async ({ path }) => {
      const { data } = await supabase.storage.from('feedback').createSignedUrl(path, 60 * 10)
      return data?.signedUrl ?? null
    })
  )

  return urls.filter((url): url is string => url !== null)
})

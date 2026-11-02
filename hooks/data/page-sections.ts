import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/types/supabase'

export type PageSection = Tables<'page_sections'>
export type ContentPage = 'about' | 'help'

// About/Help copy, in display order. Read per request (no cross-request cache),
// so an edit from /admin/content shows on the next page load.
export const getPageSections = cache(async (page: ContentPage): Promise<PageSection[]> => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page', page)
    .order('order', { ascending: true })

  return data ?? []
})

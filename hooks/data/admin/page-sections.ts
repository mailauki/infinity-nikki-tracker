import { createClient } from '@/lib/supabase/server'
import { PageSection } from '../page-sections'

export async function getAllPageSections(): Promise<PageSection[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('page_sections')
    .select('*')
    .order('page', { ascending: true })
    .order('order', { ascending: true })

  return data ?? []
}

export async function getPageSectionById(id: string): Promise<PageSection | null> {
  const supabase = await createClient()

  const { data } = await supabase.from('page_sections').select('*').eq('id', id).maybeSingle()

  return data
}

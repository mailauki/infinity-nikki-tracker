'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { navLinksData } from '@/lib/nav-links'
import { toSlug } from '@/lib/utils'

export async function addSeasonCategory(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() || toSlug(title)
  const description = (formData.get('description') as string | null)?.trim() || null

  if (!title) return { error: 'Title is required.' }
  if (!slug) return { error: 'Slug is required.' }

  const { error } = await supabase.from('season_categories').insert([{ title, slug, description }])

  if (error) return { error: error.message }

  if (formData.get('add_another') === 'true')
    return { addAnother: true as const, savedTitle: title }

  redirect(navLinksData.admin.outfits.seasonCategories.list)
}

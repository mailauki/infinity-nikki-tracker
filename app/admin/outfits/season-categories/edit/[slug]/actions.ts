'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { ADMIN_DASHBOARD } from '@/lib/admin-routes'
import { editPath } from '@/lib/sitemap/page-titles'

export async function editSeasonCategory(currentSlug: string, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const image_url = (formData.get('image_url') as string | null) || null
  // Empty string is the "no group" option; store it as NULL so it reads as
  // ungrouped rather than as an FK to a group whose slug is ''.
  const season_group = (formData.get('season_group') as string | null)?.trim() || null

  if (!title) return { error: 'Title is required.' }
  if (!slug) return { error: 'Slug is required.' }

  const { error } = await supabase
    .from('season_categories')
    .update({ title, slug, description, image_url, season_group })
    .eq('slug', currentSlug)

  if (error) return { error: error.message }

  if (formData.get('update_only') === 'true') return { savedTitle: title }

  if (formData.get('update_next') === 'true') {
    const { data: next } = await supabase
      .from('season_categories')
      .select('slug')
      .gt('title', title)
      .order('title', { ascending: true })
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(editPath('/admin/outfits/season-categories', next.slug))
    redirect(ADMIN_DASHBOARD)
  }

  redirect(ADMIN_DASHBOARD)
}

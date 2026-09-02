'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD } from '@/lib/admin-routes'

export async function editSeasonGroup(currentSlug: string, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const image_url = (formData.get('image_url') as string | null) || null

  if (!title) return { error: 'Title is required.' }
  if (!slug) return { error: 'Slug is required.' }

  // A slug change cascades to season_categories.season_group via
  // season_categories_season_group_fkey (ON UPDATE CASCADE), so grouped
  // categories follow the rename rather than being orphaned. Note that any
  // uploaded image keeps its OLD storage path — the same caveat as every other
  // slug rename in this admin.
  const { error } = await supabase
    .from('season_groups')
    .update({ title, slug, description, image_url })
    .eq('slug', currentSlug)

  if (error) return { error: error.message }

  if (formData.get('update_only') === 'true') return { savedTitle: title }

  if (formData.get('update_next') === 'true') {
    const { data: next } = await supabase
      .from('season_groups')
      .select('slug')
      .gt('title', title)
      .order('title', { ascending: true })
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.outfits.seasonGroups.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }

  redirect(ADMIN_DASHBOARD)
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD } from '@/lib/admin-routes'

export async function editLocation(currentSlug: string, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''

  if (!title) return { error: 'Title is required.' }
  if (!slug) return { error: 'Slug is required.' }

  // Renaming the slug is safe: all three referencing FKs — seasons_location_fkey,
  // trials_location_fkey and momo_cloaks_location_fkey — are ON UPDATE CASCADE
  // (verified against the live schema), so seasons, trials and cloaks follow the
  // rename rather than being orphaned. `locations` carries no image_url, so the
  // storage-path caveat that applies to other slug renames in this admin does
  // not apply here.
  const { error } = await supabase.from('locations').update({ title, slug }).eq('slug', currentSlug)

  if (error) {
    if (error.code === '23505')
      return {
        error: error.message.includes('title')
          ? `A location titled "${title}" already exists.`
          : `A location with the slug "${slug}" already exists.`,
      }
    return { error: error.message }
  }

  if (formData.get('update_only') === 'true') return { savedTitle: title }

  if (formData.get('update_next') === 'true') {
    const { data: next } = await supabase
      .from('locations')
      .select('slug')
      .gt('title', title)
      .order('title', { ascending: true })
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.locations.locations.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }

  redirect(ADMIN_DASHBOARD)
}

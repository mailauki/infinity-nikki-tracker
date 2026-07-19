'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD } from '@/app/admin/form-context'

export async function editSeason(currentSlug: string, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const location = (formData.get('location') as string | null) || null
  const description = (formData.get('description') as string | null)?.trim() || null
  const image_url = (formData.get('image_url') as string | null) || null
  const alt_image_url = (formData.get('alt_image_url') as string | null) || null

  if (!title) return { error: 'Title is required.' }
  if (!slug) return { error: 'Slug is required.' }

  const { error } = await supabase
    .from('seasons')
    .update({ title, slug, location, description, image_url, alt_image_url })
    .eq('slug', currentSlug)

  if (error) return { error: error.message }

  if (formData.get('update_only') === 'true') return { savedTitle: title }

  if (formData.get('update_next') === 'true') {
    const { data: next } = await supabase
      .from('seasons')
      .select('slug')
      .gt('title', title)
      .order('title', { ascending: true })
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.outfits.seasons.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }

  redirect(ADMIN_DASHBOARD)
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD } from '@/app/admin/form-context'
import { getUserRole } from '@/hooks/user'

export async function addTrial(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const realm = (formData.get('realm') as string | null)?.trim() || null
  const description = (formData.get('description') as string | null)?.trim() || null
  const location = (formData.get('location') as string | null) || null
  const image_url = (formData.get('image_url') as string | null) || null

  const { error } = await supabase
    .from('trials')
    .insert([{ title, slug, realm, description, location, image_url }])

  if (error) return { error: error.message }

  if (formData.get('add_another') === 'true')
    return { addAnother: true as const, savedTitle: title }
  redirect(ADMIN_DASHBOARD)
}

export async function editTrial(id: number, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const realm = (formData.get('realm') as string | null)?.trim() || null
  const description = (formData.get('description') as string | null)?.trim() || null
  const location = (formData.get('location') as string | null) || null
  const image_url = (formData.get('image_url') as string | null) || null

  const { error } = await supabase
    .from('trials')
    .update({
      title,
      slug,
      realm,
      description,
      location,
      image_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  if (formData.get('update_only') === 'true') return { savedTitle: title }

  if (formData.get('update_next') === 'true') {
    const { data: next } = await supabase
      .from('trials')
      .select('slug')
      .gt('title', title)
      .order('title', { ascending: true })
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.eureka.trials.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }

  redirect(ADMIN_DASHBOARD)
}

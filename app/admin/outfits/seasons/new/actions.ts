'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { ADMIN_DASHBOARD } from '@/app/admin/form-context'
import { toSlug } from '@/lib/utils'

export async function addSeason(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() || toSlug(title)
  const location = (formData.get('location') as string | null) || null
  const description = (formData.get('description') as string | null)?.trim() || null
  const image_url = (formData.get('image_url') as string | null) || null

  if (!title) return { error: 'Title is required.' }
  if (!slug) return { error: 'Slug is required.' }

  const { error } = await supabase
    .from('seasons')
    .insert([{ title, slug, location, description, image_url }])

  if (error) return { error: error.message }

  if (formData.get('add_another') === 'true')
    return { addAnother: true as const, savedTitle: title }

  redirect(ADMIN_DASHBOARD)
}

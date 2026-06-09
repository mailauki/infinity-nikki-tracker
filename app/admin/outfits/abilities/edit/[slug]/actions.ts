'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { navLinksData } from '@/lib/nav-links'

export async function editAbility(
  currentSlug: string,
  backUrl: string,
  _: unknown,
  formData: FormData
) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''

  if (!title) return { error: 'Title is required.' }
  if (!slug) return { error: 'Slug is required.' }

  const { error } = await supabase.from('abilities').update({ title, slug }).eq('slug', currentSlug)

  if (error) return { error: error.message }

  if (formData.get('update_only') === 'true') return { savedTitle: title }
  redirect(backUrl)
}

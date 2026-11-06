'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'

export async function editPageSection(id: string, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const body = (formData.get('body') as string | null) ?? ''

  if (!title) return { error: 'Title is required.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('page_sections')
    .update({ title, body, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  if (formData.get('update_only') === 'true') return { savedTitle: title }

  redirect('/admin/content')
}

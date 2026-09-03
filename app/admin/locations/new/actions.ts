'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { ADMIN_DASHBOARD } from '@/lib/admin-routes'
import { toSlug } from '@/lib/utils'

export async function addLocation(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() || toSlug(title)

  if (!title) return { error: 'Title is required.' }
  if (!slug) return { error: 'Slug is required.' }

  const { error } = await supabase.from('locations').insert([{ title, slug }])

  // `locations` is UNIQUE on both slug and title, so a duplicate of either
  // raises 23505. Name the offending field rather than surfacing raw Postgres.
  if (error) {
    if (error.code === '23505')
      return {
        error: error.message.includes('title')
          ? `A location titled "${title}" already exists.`
          : `A location with the slug "${slug}" already exists.`,
      }
    return { error: error.message }
  }

  if (formData.get('add_another') === 'true')
    return { addAnother: true as const, savedTitle: title }

  redirect(ADMIN_DASHBOARD)
}

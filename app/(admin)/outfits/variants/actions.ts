'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toSlugVariant } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { getUserRole } from '@/hooks/user'

export async function addOutfitVariant(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const outfit_set = (formData.get('outfit_set') as string | null) || ''
  const outfit_category = (formData.get('outfit_category') as string | null) || null
  const evolution = (formData.get('evolution') as string | null) || null
  const image_url = (formData.get('image_url') as string | null) || null
  const isDefault = formData.get('default') === 'true'
  const slug =
    (formData.get('slug') as string | null)?.trim() ||
    toSlugVariant(outfit_set, outfit_category ?? '', evolution ?? '')

  const { error } = await supabase
    .from('outfit_variants')
    .insert([{ outfit_set, outfit_category, evolution, image_url, default: isDefault, slug }])

  if (error) return { error: error.message }

  redirect(navLinksData.dashboard.outfits.variants.list)
}

export async function editOutfitVariant(
  id: number,
  backUrl: string,
  _: unknown,
  formData: FormData
) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const outfit_set = (formData.get('outfit_set') as string | null) || ''
  const outfit_category = (formData.get('outfit_category') as string | null) || null
  const evolution = (formData.get('evolution') as string | null) || null
  const image_url = (formData.get('image_url') as string | null) || null
  const isDefault = formData.get('default') === 'true'
  const slug =
    (formData.get('slug') as string | null)?.trim() ||
    toSlugVariant(outfit_set, outfit_category ?? '', evolution ?? '')

  const { error } = await supabase
    .from('outfit_variants')
    .update({
      outfit_set,
      outfit_category,
      evolution,
      image_url,
      default: isDefault,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  redirect(backUrl)
}

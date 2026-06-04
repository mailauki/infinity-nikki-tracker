'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toSlugVariant } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'

export async function addEurekaVariant(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const eureka_set = (formData.get('eureka_set') as string | null) || null
  const category = (formData.get('category') as string | null) || null
  const color = (formData.get('color') as string | null) || null
  const image_url = (formData.get('image_url') as string | null) || null
  const isDefault = formData.get('default') === 'true'
  const slug =
    (formData.get('slug') as string | null)?.trim() ||
    toSlugVariant(eureka_set ?? '', category ?? '', color ?? '')

  const { error } = await supabase
    .from('eureka_variants')
    .insert([{ eureka_set, category, color, image_url, default: isDefault, slug }])

  if (error) return { error: error.message }

  if (formData.get('add_another') === 'true') return { addAnother: true as const, savedTitle: slug }
  redirect(navLinksData.dashboard.eureka.variants.list)
}

export async function editEurekaVariant(
  id: number,
  backUrl: string,
  _: unknown,
  formData: FormData
) {
  const supabase = await createClient()

  const eureka_set = (formData.get('eureka_set') as string | null) || null
  const category = (formData.get('category') as string | null) || null
  const color = (formData.get('color') as string | null) || null
  const image_url = (formData.get('image_url') as string | null) || null
  const isDefault = formData.get('default') === 'true'
  const slug =
    (formData.get('slug') as string | null)?.trim() ||
    toSlugVariant(eureka_set ?? '', category ?? '', color ?? '')

  const { error } = await supabase
    .from('eureka_variants')
    .update({
      eureka_set,
      category,
      color,
      image_url,
      default: isDefault,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  redirect(backUrl)
}

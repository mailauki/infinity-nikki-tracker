'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD } from '@/app/admin/form-context'
import { getUserRole } from '@/hooks/user'

export async function addOutfitVariant(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const outfit_set = (formData.get('outfit_set') as string | null) || null
  const outfit_category = (formData.get('outfit_category') as string | null) || null
  const seasons = (formData.get('seasons') as string | null) || null
  const season_category = (formData.get('season_category') as string | null) || null
  const rarityRaw = parseInt(formData.get('rarity') as string)
  const rarity = isNaN(rarityRaw) ? null : rarityRaw
  const style = (formData.get('style') as string | null) || null
  const label = (formData.get('label') as string | null) || null
  const label_2 = (formData.get('label_2') as string | null) || null
  const title = (formData.get('title') as string | null)?.trim() || null
  const description = (formData.get('description') as string | null)?.trim() || null
  const isDefault = formData.get('default') === 'true'
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''

  if (!slug) return { error: 'Slug is required.' }

  const { error } = await supabase.from('outfit_variants').insert([
    {
      outfit_set,
      outfit_category,
      seasons,
      season_category,
      rarity,
      style,
      label,
      label_2,
      title,
      description,
      default: isDefault,
      slug,
    },
  ])

  if (error) return { error: error.message }

  if (formData.get('add_another') === 'true') return { addAnother: true as const, savedTitle: slug }
  redirect(ADMIN_DASHBOARD)
}

export async function editOutfitVariant(id: number, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const outfit_set = (formData.get('outfit_set') as string | null) || null
  const outfit_category = (formData.get('outfit_category') as string | null) || null
  const seasons = (formData.get('seasons') as string | null) || null
  const season_category = (formData.get('season_category') as string | null) || null
  const rarityRaw = parseInt(formData.get('rarity') as string)
  const rarity = isNaN(rarityRaw) ? null : rarityRaw
  const style = (formData.get('style') as string | null) || null
  const label = (formData.get('label') as string | null) || null
  const label_2 = (formData.get('label_2') as string | null) || null
  const title = (formData.get('title') as string | null)?.trim() || null
  const description = (formData.get('description') as string | null)?.trim() || null
  const isDefault = formData.get('default') === 'true'
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''

  if (!slug) return { error: 'Slug is required.' }

  const { error } = await supabase
    .from('outfit_variants')
    .update({
      outfit_set,
      outfit_category,
      seasons,
      season_category,
      rarity,
      style,
      label,
      label_2,
      title,
      description,
      default: isDefault,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  if (formData.get('update_only') === 'true') return { savedTitle: slug }

  if (formData.get('update_next') === 'true') {
    const { data: next } = await supabase
      .from('outfit_variants')
      .select('slug')
      .gt('slug', slug)
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.outfits.variants.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }

  redirect(ADMIN_DASHBOARD)
}

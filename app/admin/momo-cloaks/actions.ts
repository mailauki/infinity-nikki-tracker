'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD } from '@/lib/admin-routes'
import { getUserRole } from '@/hooks/user'

function readForm(formData: FormData) {
  const rarityRaw = formData.get('rarity') as string | null
  return {
    title: (formData.get('title') as string | null)?.trim() ?? '',
    slug: (formData.get('slug') as string | null)?.trim() ?? '',
    description: (formData.get('description') as string | null)?.trim() || null,
    rarity: rarityRaw ? parseInt(rarityRaw, 10) : null,
    style: (formData.get('style') as string | null) || null,
    label: (formData.get('label') as string | null) || null,
    seasons: (formData.get('seasons') as string | null) || null,
    season_category: (formData.get('season_category') as string | null) || null,
    location: (formData.get('location') as string | null) || null,
    outfit_set: (formData.get('outfit_set') as string | null) || null,
    image_url: (formData.get('image_url') as string | null) || null,
    alt_image_url: (formData.get('alt_image_url') as string | null) || null,
  }
}

// momo_cloaks.rarity is nullable (unlike makeup_sets.rarity), so rarity is
// optional here — a cloak with unknown rarity is a legitimate draft state.
function validate(values: ReturnType<typeof readForm>) {
  if (!values.title) return 'Title is required.'
  if (!values.slug) return 'Slug is required.'
  return null
}

export async function addMomoCloak(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const values = readForm(formData)
  const invalid = validate(values)
  if (invalid) return { error: invalid }

  const supabase = await createClient()
  const { error } = await supabase.from('momo_cloaks').insert([values])
  if (error) return { error: error.message }

  if (formData.get('add_another') === 'true')
    return { addAnother: true as const, savedTitle: values.title }

  redirect(ADMIN_DASHBOARD)
}

export async function updateMomoCloak(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const originalSlug = (formData.get('original_slug') as string | null) ?? ''
  const values = readForm(formData)
  const invalid = validate(values)
  if (invalid) return { error: invalid }

  const supabase = await createClient()
  const { error } = await supabase.from('momo_cloaks').update(values).eq('slug', originalSlug)
  if (error) return { error: error.message }

  // A slug rename needs no fix-up on obtained_momo_cloaks: its FK is declared
  // ON UPDATE CASCADE, and unlike makeup_variants there is no derived slug
  // column to rewrite by hand.

  if (formData.get('update_only') === 'true') {
    return { savedTitle: values.title }
  }
  if (formData.get('update_next') === 'true') {
    const { data: next } = await supabase
      .from('momo_cloaks')
      .select('slug')
      .gt('title', values.title)
      .order('title', { ascending: true })
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.momoCloaks.cloaks.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }
  redirect(ADMIN_DASHBOARD)
}

export async function deleteMomoCloak(slug: string) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()
  const { error } = await supabase.from('momo_cloaks').delete().eq('slug', slug)
  if (error) return { error: error.message }

  return { success: true }
}

// Lightweight id-keyed update for the DataGrid's inline row editing; the
// FormData/slug-keyed updateMomoCloak above serves the dedicated edit form.
export async function updateMomoCloakRow(
  id: number,
  fields: {
    title?: string
    description?: string | null
    rarity?: number | null
    style?: string | null
    label?: string | null
    seasons?: string | null
    season_category?: string | null
    location?: string | null
    outfit_set?: string | null
  }
) {
  const role = await getUserRole()
  if (role !== 'admin') throw new Error('Forbidden')

  const supabase = await createClient()

  // FK columns reject '' — the grid's singleSelect '—' option yields an empty
  // string, so coerce those to null before writing.
  const FK_FIELDS = [
    'style',
    'label',
    'seasons',
    'season_category',
    'location',
    'outfit_set',
  ] as const
  const normalized = { ...fields }
  for (const key of FK_FIELDS) {
    if (normalized[key] === '') normalized[key] = null
  }

  const { data, error } = await supabase
    .from('momo_cloaks')
    .update({ ...normalized, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

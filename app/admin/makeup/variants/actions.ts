'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD } from '@/lib/admin-routes'
import { getUserRole } from '@/hooks/user'

// makeup_set is nullable — a variant with no set is a standalone piece with
// its own title/description/rarity/style/label. The select's empty-string
// "—" option must be coerced to null here, otherwise it violates the FK.
function readForm(formData: FormData) {
  const rarityRaw = formData.get('rarity') as string | null
  return {
    makeup_set: (formData.get('makeup_set') as string | null) || null,
    makeup_category: (formData.get('makeup_category') as string | null) || null,
    rarity: rarityRaw ? parseInt(rarityRaw, 10) : null,
    style: (formData.get('style') as string | null) || null,
    label: (formData.get('label') as string | null) || null,
    title: (formData.get('title') as string | null)?.trim() || null,
    description: (formData.get('description') as string | null)?.trim() || null,
    slug: (formData.get('slug') as string | null)?.trim() ?? '',
  }
}

function validate(values: ReturnType<typeof readForm>) {
  if (!values.slug) return 'Slug is required.'
  // A standalone piece (no makeup_set) has nothing else to display, so it
  // must carry its own title.
  if (!values.makeup_set && !values.title) return 'Title is required for a standalone piece.'
  return null
}

export async function addMakeupVariant(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const values = readForm(formData)
  const invalid = validate(values)
  if (invalid) return { error: invalid }

  const supabase = await createClient()
  // Do not write `default` — the enforce_base_makeup_variant_default trigger
  // owns that column and would have its value silently overwritten anyway.
  const { error } = await supabase.from('makeup_variants').insert([values])

  if (error) return { error: error.message }

  if (formData.get('add_another') === 'true')
    return { addAnother: true as const, savedTitle: values.slug }
  redirect(ADMIN_DASHBOARD)
}

export async function editMakeupVariant(id: number, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const values = readForm(formData)
  const invalid = validate(values)
  if (invalid) return { error: invalid }

  const supabase = await createClient()
  // Do not write `default` — the enforce_base_makeup_variant_default trigger
  // owns that column and would have its value silently overwritten anyway.
  const { error } = await supabase
    .from('makeup_variants')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  if (formData.get('update_only') === 'true') return { savedTitle: values.slug }

  if (formData.get('update_next') === 'true') {
    const { data: next } = await supabase
      .from('makeup_variants')
      .select('slug')
      .gt('slug', values.slug)
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.makeup.variants.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }

  redirect(ADMIN_DASHBOARD)
}

export async function deleteMakeupVariant(slug: string) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()
  const { error } = await supabase.from('makeup_variants').delete().eq('slug', slug)
  if (error) return { error: error.message }

  return { success: true }
}

// Lightweight id-keyed update for the DataGrid's inline row-editing (mirrors
// updateOutfitVariant in app/admin/actions.ts).
export async function updateMakeupVariantRow(
  id: number,
  fields: {
    makeup_set?: string | null
    makeup_category?: string | null
    title?: string | null
    rarity?: number | null
    style?: string | null
    label?: string | null
  }
) {
  const role = await getUserRole()
  if (role !== 'admin') throw new Error('Forbidden')

  const supabase = await createClient()

  // FK columns reject '' — the grid's singleSelect '—' option yields an empty
  // string, so coerce those to null before writing.
  const FK_FIELDS = ['makeup_set', 'makeup_category', 'style', 'label'] as const
  const normalized = { ...fields }
  for (const key of FK_FIELDS) {
    if (normalized[key] === '') normalized[key] = null
  }

  const { data, error } = await supabase
    .from('makeup_variants')
    .update({ ...normalized, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

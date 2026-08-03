'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserRole } from '@/hooks/user'

function readForm(formData: FormData) {
  const rarityRaw = formData.get('rarity') as string | null
  const orderRaw = formData.get('order') as string | null
  return {
    title: (formData.get('title') as string | null)?.trim() ?? '',
    slug: (formData.get('slug') as string | null)?.trim() ?? '',
    description: (formData.get('description') as string | null)?.trim() || null,
    rarity: rarityRaw ? parseInt(rarityRaw, 10) : null,
    style: (formData.get('style') as string | null) || null,
    label: (formData.get('label') as string | null) || null,
    seasons: (formData.get('seasons') as string | null) || null,
    season_category: (formData.get('season_category') as string | null) || null,
    outfit_set: (formData.get('outfit_set') as string | null) || null,
    base_set: (formData.get('base_set') as string | null) || null,
    order: orderRaw ? parseInt(orderRaw, 10) : 1,
    image_url: (formData.get('image_url') as string | null) || null,
    alt_image_url: (formData.get('alt_image_url') as string | null) || null,
  }
}

// An evolution must point at a base set and sort after it; a base set must do
// neither, and a set can never point at itself. Enforced here because the DB
// allows any (base_set, order) pair. Shared by both mutation paths — the
// FormData/slug-keyed add/update actions below AND the DataGrid's id-keyed
// updateMakeupSetRow — so the invariant can't be bypassed by editing a single
// cell (e.g. `order` alone) inline. Takes just the fields the rule needs so
// either caller can feed it either a fresh form read or an existing-row +
// patch merge.
function validateBaseEvolutionInvariants(values: {
  slug: string
  base_set: string | null
  order: number
}) {
  if (values.base_set && values.order < 2) return 'An evolution needs an order of 2 or higher.'
  if (!values.base_set && values.order !== 1) return 'A base set must have order 1.'
  if (values.base_set && values.base_set === values.slug) return 'A set cannot be its own base.'
  return null
}

function validate(values: ReturnType<typeof readForm>) {
  if (!values.title) return 'Title is required.'
  if (!values.slug) return 'Slug is required.'
  if (!values.rarity) return 'Rarity is required.'
  return validateBaseEvolutionInvariants(values)
}

export async function addMakeupSet(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const values = readForm(formData)
  const invalid = validate(values)
  if (invalid) return { error: invalid }
  // validate() already rejected a falsy rarity — narrow the DB's NOT NULL column.
  const insertValues = { ...values, rarity: values.rarity as number }

  const supabase = await createClient()
  const { error } = await supabase.from('makeup_sets').insert([insertValues])
  if (error) return { error: error.message }

  revalidatePath('/admin/makeup/sets')
  return { success: true, savedTitle: values.title }
}

export async function updateMakeupSet(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const originalSlug = (formData.get('original_slug') as string | null) ?? ''
  const values = readForm(formData)
  const invalid = validate(values)
  if (invalid) return { error: invalid }
  // validate() already rejected a falsy rarity — narrow the DB's NOT NULL column.
  const updateValues = { ...values, rarity: values.rarity as number }

  const supabase = await createClient()
  const { error } = await supabase.from('makeup_sets').update(updateValues).eq('slug', originalSlug)
  if (error) return { error: error.message }

  revalidatePath('/admin/makeup/sets')
  return { success: true, savedTitle: values.title }
}

export async function deleteMakeupSet(slug: string) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()
  const { error } = await supabase.from('makeup_sets').delete().eq('slug', slug)
  if (error) return { error: error.message }

  revalidatePath('/admin/makeup/sets')
  return { success: true }
}

// Lightweight id-keyed update for the DataGrid's inline row-editing (mirrors
// updateOutfitSet / updateEurekaSet in app/admin/actions.ts). The full
// FormData-based updateMakeupSet above targets the dedicated edit form, keyed
// by slug; this one targets a single DataGrid row by id.
export async function updateMakeupSetRow(
  id: number,
  fields: {
    title?: string
    description?: string | null
    rarity?: number
    style?: string | null
    label?: string | null
    seasons?: string | null
    season_category?: string | null
    outfit_set?: string | null
    base_set?: string | null
    order?: number
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
    'outfit_set',
    'base_set',
  ] as const
  const normalized = { ...fields }
  for (const key of FK_FIELDS) {
    if (normalized[key] === '') normalized[key] = null
  }

  // The grid only sends CHANGED fields (e.g. a lone `order` edit), so the
  // base/evolution invariants can't be checked against `fields` alone — an
  // edit to `order` must be validated against the row's existing `base_set`,
  // and vice versa. Fetch the current row and validate the merged result.
  // The self-base check also needs the row's slug, which `fields` never
  // carries (slug isn't editable in the grid).
  const { data: existing, error: fetchError } = await supabase
    .from('makeup_sets')
    .select('slug, base_set, order')
    .eq('id', id)
    .single()
  if (fetchError) throw new Error(fetchError.message)

  const merged = {
    slug: existing.slug,
    base_set: 'base_set' in normalized ? (normalized.base_set ?? null) : existing.base_set,
    order: normalized.order ?? existing.order,
  }
  const invalid = validateBaseEvolutionInvariants(merged)
  if (invalid) throw new Error(invalid)

  const { data, error } = await supabase
    .from('makeup_sets')
    .update({ ...normalized, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

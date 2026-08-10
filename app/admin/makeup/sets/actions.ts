'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD } from '@/lib/admin-routes'
import { getUserRole } from '@/hooks/user'
import { toSlugMakeup } from '@/lib/utils'

function readForm(formData: FormData) {
  const rarityRaw = formData.get('rarity') as string | null
  const orderRaw = formData.get('order') as string | null
  const makeupCategories = JSON.parse((formData.get('makeup_categories') as string) || '[]') as {
    slug: string
  }[]
  return {
    title: (formData.get('title') as string | null)?.trim() ?? '',
    slug: (formData.get('slug') as string | null)?.trim() ?? '',
    description: (formData.get('description') as string | null)?.trim() || null,
    rarity: rarityRaw ? parseInt(rarityRaw, 10) : null,
    style: (formData.get('style') as string | null) || null,
    seasons: (formData.get('seasons') as string | null) || null,
    season_category: (formData.get('season_category') as string | null) || null,
    outfit_set: (formData.get('outfit_set') as string | null) || null,
    base_set: (formData.get('base_set') as string | null) || null,
    order: orderRaw ? parseInt(orderRaw, 10) : 1,
    image_url: (formData.get('image_url') as string | null) || null,
    alt_image_url: (formData.get('alt_image_url') as string | null) || null,
    makeupCategories,
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

  const formValues = readForm(formData)
  const invalid = validate(formValues)
  if (invalid) return { error: invalid }
  const { makeupCategories, ...values } = formValues
  // validate() already rejected a falsy rarity — narrow the DB's NOT NULL column.
  const insertValues = { ...values, rarity: values.rarity as number }

  const supabase = await createClient()
  const { error } = await supabase.from('makeup_sets').insert([insertValues])
  if (error) return { error: error.message }

  const rollback = async () => {
    await supabase.from('makeup_sets').delete().eq('slug', values.slug)
  }

  // Create one variant per selected category. NEVER write `default` here — a
  // DB trigger (enforce_base_makeup_variant_default) owns it, setting
  // default=true when the parent set's order=1 and false otherwise.
  if (makeupCategories.length > 0) {
    const variants = makeupCategories.map((cat) => ({
      makeup_set: values.slug,
      makeup_category: cat.slug,
      slug: toSlugMakeup(values.slug, cat.slug),
      rarity: values.rarity as number,
      style: values.style,
    }))
    const { error: variantError } = await supabase.from('makeup_variants').insert(variants)
    if (variantError) {
      await rollback()
      return { error: 'Failed to save variants. The set was not created — please try again.' }
    }
  }

  if (formData.get('add_another') === 'true')
    return { addAnother: true as const, savedTitle: values.title }
  redirect(ADMIN_DASHBOARD)
}

export async function updateMakeupSet(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const originalSlug = (formData.get('original_slug') as string | null) ?? ''
  const formValues = readForm(formData)
  const invalid = validate(formValues)
  if (invalid) return { error: invalid }
  const { makeupCategories, ...values } = formValues
  // validate() already rejected a falsy rarity — narrow the DB's NOT NULL column.
  const updateValues = { ...values, rarity: values.rarity as number }

  const supabase = await createClient()
  const { error } = await supabase.from('makeup_sets').update(updateValues).eq('slug', originalSlug)
  if (error) return { error: error.message }

  const slug = values.slug

  // If the base slug changed, rename base variant slugs — the makeup_set FK
  // cascades (on update cascade), but the variant's own `slug` text column
  // (`{set}-{category}`) is not derived from the FK and must be updated by hand.
  if (originalSlug !== slug) {
    const { data: baseVariants } = await supabase
      .from('makeup_variants')
      .select('slug, makeup_category')
      .eq('makeup_set', slug)

    for (const v of baseVariants ?? []) {
      if (!v.makeup_category || v.slug !== toSlugMakeup(originalSlug, v.makeup_category)) continue
      const { error: renameError } = await supabase
        .from('makeup_variants')
        .update({ slug: toSlugMakeup(slug, v.makeup_category) })
        .eq('slug', v.slug)
      if (renameError) return { error: renameError.message }
    }
  }

  // Sync variants: diff DB state against (state slugs × categories), covering
  // the base set and all of its evolutions (makeup_sets rows with base_set = slug).
  const { data: evolutionRows } = await supabase
    .from('makeup_sets')
    .select('slug')
    .eq('base_set', slug)
  const stateSlugs: string[] = [slug, ...(evolutionRows ?? []).map((e) => e.slug)]

  if (makeupCategories.length > 0) {
    const expectedVariants = stateSlugs.flatMap((stateSlug) =>
      makeupCategories.map((cat) => ({
        makeup_set: stateSlug,
        makeup_category: cat.slug,
        slug: toSlugMakeup(stateSlug, cat.slug),
        rarity: values.rarity as number,
        style: values.style,
      }))
    )
    const expectedSlugs = new Set(expectedVariants.map((v) => v.slug))

    const { data: currentVariants } = await supabase
      .from('makeup_variants')
      .select('slug, makeup_set, makeup_category')
      .in('makeup_set', stateSlugs)

    const currentSlugsInDB = new Set((currentVariants ?? []).map((v) => v.slug))

    const toInsert = expectedVariants.filter((v) => !currentSlugsInDB.has(v.slug))
    const toDelete = (currentVariants ?? [])
      .filter((v) => !expectedSlugs.has(v.slug))
      .map((v) => v.slug)

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('makeup_variants').insert(toInsert)
      if (insertError) return { error: insertError.message }
    }

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('makeup_variants')
        .delete()
        .in('slug', toDelete)
      if (deleteError) return { error: deleteError.message }
    }
  } else {
    // No categories selected — remove all variants for base and evolutions.
    const { error: deleteAllError } = await supabase
      .from('makeup_variants')
      .delete()
      .in('makeup_set', stateSlugs)
    if (deleteAllError) return { error: deleteAllError.message }
  }

  // Resolve a submitted variant input key back to its current DB slug, carrying
  // the slug across a base set rename (variant_image_ / variant_title_ / etc.).
  const resolveVariantSlug = (submittedSlug: string) =>
    originalSlug !== slug && submittedSlug.startsWith(`${originalSlug}-`)
      ? submittedSlug.replace(`${originalSlug}-`, `${slug}-`)
      : submittedSlug

  // Update variant images from hidden inputs.
  const variantImageEntries = [...formData.entries()].filter(([key]) =>
    key.startsWith('variant_image_')
  )
  for (const [key, value] of variantImageEntries) {
    const variantSlug = resolveVariantSlug(key.replace('variant_image_', ''))
    const { error: imgError } = await supabase
      .from('makeup_variants')
      .update({ image_url: (value as string) || null })
      .eq('slug', variantSlug)
    if (imgError) return { error: imgError.message }
  }

  // Update variant titles from text inputs.
  const variantTitleEntries = [...formData.entries()].filter(([key]) =>
    key.startsWith('variant_title_')
  )
  for (const [key, value] of variantTitleEntries) {
    const variantSlug = resolveVariantSlug(key.replace('variant_title_', ''))
    const { error: titleError } = await supabase
      .from('makeup_variants')
      .update({ title: (value as string).trim() || null })
      .eq('slug', variantSlug)
    if (titleError) return { error: titleError.message }
  }

  // Update variant descriptions from text inputs.
  const variantDescriptionEntries = [...formData.entries()].filter(([key]) =>
    key.startsWith('variant_description_')
  )
  for (const [key, value] of variantDescriptionEntries) {
    const variantSlug = resolveVariantSlug(key.replace('variant_description_', ''))
    const { error: descError } = await supabase
      .from('makeup_variants')
      .update({ description: (value as string).trim() || null })
      .eq('slug', variantSlug)
    if (descError) return { error: descError.message }
  }

  if (formData.get('update_only') === 'true') {
    const { data: variants } = await supabase
      .from('makeup_variants')
      .select('id, slug, makeup_set, makeup_category, image_url, alt_image_url, title, description')
      .eq('makeup_set', slug)
      .order('id', { ascending: true })

    return { savedTitle: values.title, variants: variants ?? [] }
  }
  if (formData.get('update_next') === 'true') {
    const { data: next } = await supabase
      .from('makeup_sets')
      .select('slug')
      .is('base_set', null)
      .gt('title', values.title)
      .order('title', { ascending: true })
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.makeup.sets.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }
  redirect(ADMIN_DASHBOARD)
}

export async function deleteMakeupSet(slug: string) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()
  const { error } = await supabase.from('makeup_sets').delete().eq('slug', slug)
  if (error) return { error: error.message }

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
  const FK_FIELDS = ['style', 'seasons', 'season_category', 'outfit_set', 'base_set'] as const
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

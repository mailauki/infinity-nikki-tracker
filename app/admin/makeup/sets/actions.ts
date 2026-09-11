'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { navLinksData } from '@/lib/nav-links'
import { ADMIN_DASHBOARD } from '@/lib/admin-routes'
import { getUserRole } from '@/hooks/user'
import { toSlugMakeup } from '@/lib/utils'
import { makeupSetOrder, OutfitLineRow, resolveEvolutionOutfitSet } from '@/hooks/makeup'

// The admin dashboard is a Server Component behind a client Router Cache entry.
// Without this, redirecting back after a save re-renders the cached copy and
// the gap-queue counts look unchanged even though the write succeeded.
function revalidateAdmin() {
  revalidatePath(ADMIN_DASHBOARD)
}

// The standalone-pieces set holds individually-authored variants (many per
// category, with their own title/description/image) managed via the
// standalone-variant admin — its variants are NOT generated from
// (state × category), so the set-edit variant-sync must skip it or it deletes
// every real piece as "unexpected", and the per-variant write-back below must
// skip it or it overwrites each piece with this page's snapshot.
const STANDALONE_PIECES_SLUG = 'standalone_pieces'

type MakeupSupabase = Awaited<ReturnType<typeof createClient>>

// An evolution's `outfit_set` is derived from its base set's, so it needs the
// base's pairing, that outfit row (which may itself be an evolution, so the line
// root comes off it) and the line's siblings. The admin forms resolve the same
// thing from the full outfit list they already hold; this is the server's route
// to the identical answer, so both go through resolveEvolutionOutfitSet().
async function deriveEvolutionOutfitSet(
  supabase: MakeupSupabase,
  baseSetSlug: string
): Promise<string | null> {
  const { data: base } = await supabase
    .from('makeup_sets')
    .select('outfit_set')
    .eq('slug', baseSetSlug)
    .maybeSingle()
  if (!base?.outfit_set) return null

  const { data: pairedRow } = await supabase
    .from('outfit_sets')
    .select('slug, base_set, "order"')
    .eq('slug', base.outfit_set)
    .maybeSingle()
  const paired = pairedRow as OutfitLineRow | null
  if (!paired) return null

  const { data: siblingRows } = await supabase
    .from('outfit_sets')
    .select('slug, base_set, "order"')
    .eq('base_set', paired.base_set ?? paired.slug)

  // `paired` is prepended so the resolver can find it whether it is the line's
  // base row (not returned by the sibling query) or one of the evolutions (in
  // which case it appears twice, which changes no lookup).
  return resolveEvolutionOutfitSet(base.outfit_set, [
    paired,
    ...((siblingRows ?? []) as OutfitLineRow[]),
  ])
}

// The evolution rows a pairing cascade rewrote, for the DataGrid to merge into
// its own copy of them.
type EvolutionPairingSync = {
  error: string | null
  rows: { id: number; slug: string; outfit_set: string | null }[]
}

// Push a base set's pairing down to its evolutions. A base set is the only place
// the pairing is authored, so repointing it has to move every evolution with it
// or the derived links drift.
//
// Only mismatched rows are written: `trg_makeup_sets_updated_at` bumps
// updated_at on every row an UPDATE touches, so writing unconditionally would
// shuffle untouched evolutions to the front of the admin lists' "recently
// updated" ordering on every save of their base.
async function syncEvolutionOutfitSets(
  supabase: MakeupSupabase,
  baseSlug: string
): Promise<EvolutionPairingSync> {
  const derived = await deriveEvolutionOutfitSet(supabase, baseSlug)

  const { data: evolutions } = await supabase
    .from('makeup_sets')
    .select('id, slug, outfit_set')
    .eq('base_set', baseSlug)

  const stale = (evolutions ?? []).filter((row) => row.outfit_set !== derived)
  if (stale.length === 0) return { error: null, rows: [] }

  const { error } = await supabase
    .from('makeup_sets')
    .update({ outfit_set: derived })
    .in(
      'id',
      stale.map((row) => row.id)
    )

  return {
    error: error?.message ?? null,
    rows: stale.map((row) => ({ ...row, outfit_set: derived })),
  }
}

function readForm(formData: FormData) {
  const rarityRaw = formData.get('rarity') as string | null
  const makeupCategories = JSON.parse((formData.get('makeup_categories') as string) || '[]') as {
    slug: string
  }[]
  const base_set = (formData.get('base_set') as string | null) || null
  return {
    title: (formData.get('title') as string | null)?.trim() ?? '',
    slug: (formData.get('slug') as string | null)?.trim() ?? '',
    description: (formData.get('description') as string | null)?.trim() || null,
    rarity: rarityRaw ? parseInt(rarityRaw, 10) : null,
    style: (formData.get('style') as string | null) || null,
    seasons: (formData.get('seasons') as string | null) || null,
    season_category: (formData.get('season_category') as string | null) || null,
    outfit_set: (formData.get('outfit_set') as string | null) || null,
    base_set,
    // Derived, never submitted — the forms have no order control.
    order: makeupSetOrder({ base_set }),
    image_url: (formData.get('image_url') as string | null) || null,
    alt_image_url: (formData.get('alt_image_url') as string | null) || null,
    makeupCategories,
  }
}

// A set can never point at itself. Enforced here because the DB's self-FK
// allows it. Shared by both mutation paths — the FormData/slug-keyed add/update
// actions below AND the DataGrid's id-keyed updateMakeupSetRow — so the
// invariant can't be bypassed by editing a single cell inline. Takes just the
// fields the rule needs so either caller can feed it either a fresh form read
// or an existing-row + patch merge.
//
// `order` needs no validation: both paths derive it from base_set via
// makeupSetOrder() rather than accepting a submitted value.
function validateBaseSetInvariants(values: { slug: string; base_set: string | null }) {
  if (values.base_set && values.base_set === values.slug) return 'A set cannot be its own base.'
  return null
}

function validate(values: ReturnType<typeof readForm>) {
  if (!values.title) return 'Title is required.'
  if (!values.slug) return 'Slug is required.'
  if (!values.rarity) return 'Rarity is required.'
  return validateBaseSetInvariants(values)
}

export async function addMakeupSet(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const formValues = readForm(formData)
  const invalid = validate(formValues)
  if (invalid) return { error: invalid }
  const { makeupCategories, ...values } = formValues

  const supabase = await createClient()

  // An evolution's pairing is derived from its base set's, so the form submits
  // no outfit for one and any stale value is discarded here.
  const outfit_set = values.base_set
    ? await deriveEvolutionOutfitSet(supabase, values.base_set)
    : values.outfit_set
  // validate() already rejected a falsy rarity — narrow the DB's NOT NULL column.
  const insertValues = { ...values, outfit_set, rarity: values.rarity as number }

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
  revalidateAdmin()
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

  const supabase = await createClient()

  // An evolution's pairing is derived from its base set's, so the form submits
  // no outfit for one and any stale value is discarded here.
  const outfit_set = values.base_set
    ? await deriveEvolutionOutfitSet(supabase, values.base_set)
    : values.outfit_set
  // validate() already rejected a falsy rarity — narrow the DB's NOT NULL column.
  const updateValues = { ...values, outfit_set, rarity: values.rarity as number }

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

  // This set's evolutions read their pairing off it, so repointing a base set at
  // a different outfit has to move them too. Runs after the write above (the
  // derivation reads the base's stored pairing) and after the rename (base_set
  // cascades on the slug change, so `slug` already matches them).
  if (!values.base_set) {
    const { error: pairingError } = await syncEvolutionOutfitSets(supabase, slug)
    if (pairingError) return { error: pairingError }
  }

  // Sync variants: diff DB state against (state slugs × categories), covering
  // the base set and all of its evolutions (makeup_sets rows with base_set = slug).
  const { data: evolutionRows } = await supabase
    .from('makeup_sets')
    .select('slug')
    .eq('base_set', slug)
  const stateSlugs: string[] = [slug, ...(evolutionRows ?? []).map((e) => e.slug)]

  // Fields a variant inherits from its owning set. Variants diverge from their
  // set only on image and title; everything here is owned by the set.
  const variantSharedFields = {
    rarity: values.rarity as number,
    style: values.style,
    seasons: values.seasons,
    season_category: values.season_category,
  }

  // See STANDALONE_PIECES_SLUG: this set's variants are authored by hand, not
  // derived from (state × category), so the diff below would delete all of them.
  const isManualVariantSet =
    slug === STANDALONE_PIECES_SLUG || originalSlug === STANDALONE_PIECES_SLUG

  if (isManualVariantSet) {
    // No-op: leave the manually-authored variants untouched.
  } else if (makeupCategories.length > 0) {
    const expectedVariants = stateSlugs.flatMap((stateSlug) =>
      makeupCategories.map((cat) => ({
        makeup_set: stateSlug,
        makeup_category: cat.slug,
        slug: toSlugMakeup(stateSlug, cat.slug),
        ...variantSharedFields,
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

    // Push shared fields onto variants that already exist — the spread above
    // only reaches `toInsert`, so editing a set left every existing variant on
    // its old value.
    const toUpdate = (currentVariants ?? [])
      .filter((v) => expectedSlugs.has(v.slug))
      .map((v) => v.slug)

    if (toUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('makeup_variants')
        .update(variantSharedFields)
        .in('slug', toUpdate)
      if (updateError) return { error: updateError.message }
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

  // The standalone-pieces set's variants own their own title/description/image,
  // edited one at a time in the standalone-variant admin. The set form renders a
  // card per piece and posts all three fields back for every one on every save,
  // touched or not, so saving here would rewrite each piece with whatever this
  // page loaded. Nothing on this page owns those columns — skip the write-back.
  if (!isManualVariantSet) {
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

    // Revalidate before either redirect — redirect() throws, so anything after
    // the first one never runs.
    revalidateAdmin()
    if (next?.slug) redirect(`${navLinksData.admin.makeup.sets.edit}/${next.slug}`)
    redirect(ADMIN_DASHBOARD)
  }
  revalidateAdmin()
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

  // The grid only sends CHANGED fields, so base_set may be absent from this
  // patch while still deciding the row's derived `order`. Fetch the current row
  // and resolve against the merged result. The self-base check also needs the
  // row's slug, which `fields` never carries (slug isn't editable in the grid).
  const { data: existing, error: fetchError } = await supabase
    .from('makeup_sets')
    .select('slug, base_set')
    .eq('id', id)
    .single()
  if (fetchError) throw new Error(fetchError.message)

  const merged = {
    slug: existing.slug,
    base_set: 'base_set' in normalized ? (normalized.base_set ?? null) : existing.base_set,
  }
  const invalid = validateBaseSetInvariants(merged)
  if (invalid) throw new Error(invalid)

  // An evolution's pairing is derived from its base set's, so the Associated
  // Outfit cell is read-only on an evolution row and any value in the patch is
  // replaced. A base row keeps whatever the patch carries — that cell is where
  // the whole line's pairing is authored.
  const derivedPairing = merged.base_set
    ? { outfit_set: await deriveEvolutionOutfitSet(supabase, merged.base_set) }
    : {}

  // `order` is written on every row edit rather than only when base_set moves:
  // it costs nothing when the row already conforms, and it self-heals a legacy
  // row whose stored order predates the derivation. The grid reads both derived
  // columns back off the returned row.
  const { data, error } = await supabase
    .from('makeup_sets')
    .update({
      ...normalized,
      ...derivedPairing,
      order: makeupSetOrder(merged),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Editing a base row's pairing moves its evolutions' too. They are separate
  // grid rows, so they come back alongside the written row for the grid to merge
  // — without that they would show a stale outfit until the page reloads.
  const cascaded: EvolutionPairingSync = merged.base_set
    ? { error: null, rows: [] }
    : await syncEvolutionOutfitSets(supabase, data.slug)
  if (cascaded.error) throw new Error(cascaded.error)

  return { row: data, cascadedEvolutions: cascaded.rows }
}

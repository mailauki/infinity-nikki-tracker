'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toSlug } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { getUserRole } from '@/hooks/user'
import { EvolutionDraft } from '@/lib/types/outfit'

// The standalone-pieces set holds individually-authored variants (many per
// category, own slugs) managed via the standalone-variant admin — its variants
// are NOT generated from (state × category), so the set-edit variant-sync must
// skip it or it deletes every real piece as "unexpected".
const STANDALONE_PIECES_SLUG = 'standalone-pieces'

export async function addOutfitSet(_: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const rarityRaw = formData.get('rarity') as string | null
  const rarity = rarityRaw ? parseInt(rarityRaw, 10) : null
  const style = (formData.get('style') as string | null) || null
  const label = (formData.get('label') as string | null) || null
  const label_2 = (formData.get('label_2') as string | null) || null
  const ability = (formData.get('ability') as string | null) || null
  const seasons = (formData.get('seasons') as string | null) || null
  const season_category = (formData.get('season_category') as string | null) || null
  const evolutionDrafts = JSON.parse(
    (formData.get('evolution_drafts') as string) || '[]'
  ) as EvolutionDraft[]
  const glowupEvolutionOrderRaw = (formData.get('glowup_evolution_order') as string | null) || ''
  const glowupEvolutionOrder = glowupEvolutionOrderRaw
    ? parseInt(glowupEvolutionOrderRaw, 10)
    : null
  const outfitCategories = JSON.parse((formData.get('outfit_categories') as string) || '[]') as {
    slug: string
  }[]
  const handheldBaseOnly = formData.get('handheld_base_only') === 'true'

  if (!rarity) return { error: 'Rarity is required.' }

  // Insert the base outfit_sets row (order = 1, base_set = null).
  const { error } = await supabase.from('outfit_sets').insert([
    {
      title,
      slug,
      description,
      rarity,
      style,
      label,
      label_2,
      ability,
      seasons,
      season_category,
      handheld_base_only: handheldBaseOnly,
      order: 1,
      base_set: null,
    },
  ])

  if (error) return { error: error.message }

  const rollback = async () => {
    await supabase.from('outfit_sets').delete().eq('slug', slug)
  }

  // Build sibling evolution rows (base_set = slug, order from draft + 1 to shift past base).
  // Shared set-level fields are copied from the base row so siblings stay in sync.
  const sharedFields = { rarity, style, ability, seasons, season_category, label, label_2 }
  // Subset that also exists on outfit_variants (no `ability` column there).
  const variantSharedFields = { rarity, style, seasons, season_category, label, label_2 }

  if (evolutionDrafts.length > 0) {
    const evolutionRows = evolutionDrafts.map((draft) => ({
      slug: `${slug}-${toSlug(draft.subtitle)}`,
      title: draft.subtitle,
      order: draft.order + 1,
      base_set: slug,
      ...sharedFields,
    }))

    const { error: evoError } = await supabase.from('outfit_sets').insert(evolutionRows)
    if (evoError) {
      await rollback()
      return { error: 'Failed to save evolutions. The set was not created — please try again.' }
    }

    // Set the glow-up sibling's order to 0 after all sibling rows exist.
    // glowupEvolutionOrder is a 1-based UI draft order; null/0 both mean "none".
    if (glowupEvolutionOrder) {
      const glowupDraft = evolutionDrafts.find((d) => d.order === glowupEvolutionOrder)
      if (glowupDraft) {
        const glowupSlug = `${slug}-${toSlug(glowupDraft.subtitle)}`
        await supabase.from('outfit_sets').update({ order: 0 }).eq('slug', glowupSlug)
      }
    }

    if (outfitCategories.length > 0) {
      // Base variants point at the base slug; evolution variants point at the evolution slug.
      const baseVariants = outfitCategories.map((cat) => ({
        outfit_set: slug,
        outfit_category: cat.slug,
        slug: `${slug}-${cat.slug}`,
        default: true,
        ...variantSharedFields,
      }))
      const evoVariants = evolutionRows.flatMap((evo) =>
        outfitCategories
          .filter((cat) => !(handheldBaseOnly && cat.slug === 'handhelds'))
          .map((cat) => ({
            outfit_set: evo.slug,
            outfit_category: cat.slug,
            slug: `${evo.slug}-${cat.slug}`,
            default: false,
            ...variantSharedFields,
          }))
      )
      const { error: variantError } = await supabase
        .from('outfit_variants')
        .insert([...baseVariants, ...evoVariants])
      if (variantError) {
        await rollback()
        return { error: 'Failed to save variants. The set was not created — please try again.' }
      }
    }
  } else if (outfitCategories.length > 0) {
    // No user-defined evolutions — base-only variants.
    const variants = outfitCategories.map((cat) => ({
      outfit_set: slug,
      outfit_category: cat.slug,
      slug: `${slug}-${cat.slug}`,
      default: true,
      ...variantSharedFields,
    }))
    const { error: variantError } = await supabase.from('outfit_variants').insert(variants)
    if (variantError) {
      await rollback()
      return { error: 'Failed to save variants. The set was not created — please try again.' }
    }
  }

  if (formData.get('add_another') === 'true')
    return { addAnother: true as const, savedTitle: title }
  redirect(navLinksData.admin.outfits.sets.list)
}

export async function editOutfitSet(id: number, backUrl: string, _: unknown, formData: FormData) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const rarityRaw = formData.get('rarity') as string | null
  const rarity = rarityRaw ? parseInt(rarityRaw, 10) : null
  const style = (formData.get('style') as string | null) || null
  const label = (formData.get('label') as string | null) || null
  const label_2 = (formData.get('label_2') as string | null) || null
  const ability = (formData.get('ability') as string | null) || null
  const seasons = (formData.get('seasons') as string | null) || null
  const season_category = (formData.get('season_category') as string | null) || null
  const evolutionDrafts = JSON.parse(
    (formData.get('evolution_drafts') as string) || '[]'
  ) as EvolutionDraft[]
  const glowupEvolutionOrderRaw = (formData.get('glowup_evolution_order') as string | null) || ''
  const glowupEvolutionOrder = glowupEvolutionOrderRaw
    ? parseInt(glowupEvolutionOrderRaw, 10)
    : null
  const outfitCategories = JSON.parse((formData.get('outfit_categories') as string) || '[]') as {
    slug: string
  }[]
  const handheldBaseOnly = formData.get('handheld_base_only') === 'true'

  if (!rarity) return { error: 'Rarity is required.' }

  // Capture the previous slug so we can carry variant slugs across a rename.
  const { data: existingSet } = await supabase
    .from('outfit_sets')
    .select('slug')
    .eq('id', id)
    .single()
  const previousSlug = existingSet?.slug ?? slug

  // Shared set-level fields copied onto all sibling evolution rows on every edit.
  const sharedFields = { rarity, style, ability, seasons, season_category, label, label_2 }
  // Subset that also exists on outfit_variants (no `ability` column there).
  const variantSharedFields = { rarity, style, seasons, season_category, label, label_2 }

  // The standalone-pieces set exposes only title/slug/description/images in its
  // edit form (its other set-level fields are hidden and meaningless), so persist
  // only those — never overwrite its cosmetic fields with the now-absent inputs
  // (rarity is NOT NULL and would fail).
  const isStandaloneSet = slug === STANDALONE_PIECES_SLUG || previousSlug === STANDALONE_PIECES_SLUG

  // Update the base row.
  const { error } = await supabase
    .from('outfit_sets')
    .update(
      isStandaloneSet
        ? { title, slug, description, updated_at: new Date().toISOString() }
        : {
            title,
            slug,
            description,
            ...sharedFields,
            handheld_base_only: handheldBaseOnly,
            updated_at: new Date().toISOString(),
          }
    )
    .eq('id', id)

  if (error) return { error: error.message }

  // If the base slug changed, rename base variant slugs (not FK-cascaded).
  if (previousSlug !== slug) {
    const { data: baseVariants } = await supabase
      .from('outfit_variants')
      .select('slug, outfit_category')
      .eq('outfit_set', slug)

    for (const v of baseVariants ?? []) {
      if (v.slug !== `${previousSlug}-${v.outfit_category}`) continue
      const { error: renameError } = await supabase
        .from('outfit_variants')
        .update({ slug: `${slug}-${v.outfit_category}` })
        .eq('slug', v.slug)
      if (renameError) return { error: renameError.message }
    }
  }

  // Load existing sibling evolution rows for diff.
  const { data: currentEvolutions } = await supabase
    .from('outfit_sets')
    .select('slug, "order"')
    .eq('base_set', slug)

  const currentEvoSlugs = (currentEvolutions ?? []).map((e) => e.slug)
  const submittedExistingSlugs = evolutionDrafts
    .filter((d) => d.existingSlug)
    .map((d) => d.existingSlug as string)

  // Delete removed sibling evolutions (cascade removes their variants; obtained SET NULL).
  const deletedSlugs = currentEvoSlugs.filter((s) => !submittedExistingSlugs.includes(s))
  if (deletedSlugs.length > 0) {
    const { error: deleteError } = await supabase
      .from('outfit_sets')
      .delete()
      .in('slug', deletedSlugs)
    if (deleteError) return { error: deleteError.message }
  }

  // Determine which draft is the glow-up so we can set its order to 0.
  const glowupDraft = evolutionDrafts.find((d) => d.order === glowupEvolutionOrder)
  const glowupSlug = glowupDraft ? `${slug}-${toSlug(glowupDraft.subtitle)}` : null

  // Update existing sibling evolutions.
  const updatedDrafts = evolutionDrafts.filter((d) => d.existingSlug)

  // Two-phase to avoid a transient unique(base_set, "order") collision: the index
  // is non-deferrable, so reordering siblings one statement at a time can briefly
  // duplicate an order value. First park every updated sibling at a unique negative
  // order (which never collides with the real 0/2/3… values), then set finals.
  for (let i = 0; i < updatedDrafts.length; i++) {
    const { error: parkError } = await supabase
      .from('outfit_sets')
      .update({ order: -(i + 1) })
      .eq('slug', updatedDrafts[i].existingSlug as string)
    if (parkError) return { error: parkError.message }
  }

  for (const draft of updatedDrafts) {
    const newEvoSlug = `${slug}-${toSlug(draft.subtitle)}`
    const isGlowup = glowupSlug === newEvoSlug
    const { error: updateError } = await supabase
      .from('outfit_sets')
      .update({
        slug: newEvoSlug,
        title: draft.subtitle,
        order: isGlowup ? 0 : draft.order + 1,
        base_set: slug,
        ...sharedFields,
      })
      .eq('slug', draft.existingSlug as string)
    if (updateError) return { error: updateError.message }
  }

  // Insert new sibling evolutions.
  const newDrafts = evolutionDrafts.filter((d) => !d.existingSlug)
  if (newDrafts.length > 0) {
    const newEvoRows = newDrafts.map((draft) => {
      const newEvoSlug = `${slug}-${toSlug(draft.subtitle)}`
      const isGlowup = glowupSlug === newEvoSlug
      return {
        slug: newEvoSlug,
        title: draft.subtitle,
        order: isGlowup ? 0 : draft.order + 1,
        base_set: slug,
        ...sharedFields,
      }
    })
    const { error: evoError } = await supabase.from('outfit_sets').insert(newEvoRows)
    if (evoError) return { error: evoError.message }
  }

  // The standalone-pieces set is a container of individually-authored variants
  // (many per category, with their own slugs like `silverplume-hair`) managed via
  // the standalone-variant admin — NOT generated from (state × category). The
  // variant-sync below assumes one generated `{state}-{category}` variant per
  // category and would delete every real standalone piece as "unexpected". Skip
  // sync entirely for this set; its variants are never derived from set fields.
  const isManualVariantSet =
    slug === STANDALONE_PIECES_SLUG || previousSlug === STANDALONE_PIECES_SLUG

  // Sync variants: diff DB state against (state slugs × categories).
  // Each state is either the base (outfit_set = slug) or a sibling (outfit_set = evo slug).
  if (isManualVariantSet) {
    // No-op: leave the manually-authored variants untouched.
  } else if (outfitCategories.length > 0) {
    const { data: finalEvolutions } = await supabase
      .from('outfit_sets')
      .select('slug')
      .eq('base_set', slug)

    // State slugs: base slug first, then all sibling slugs.
    const stateSlugs: string[] = [slug, ...(finalEvolutions ?? []).map((e) => e.slug)]

    const expectedVariants = stateSlugs.flatMap((stateSlug) =>
      outfitCategories
        .filter((cat) => !(handheldBaseOnly && stateSlug !== slug && cat.slug === 'handhelds'))
        .map((cat) => ({
          outfit_set: stateSlug,
          outfit_category: cat.slug,
          slug: `${stateSlug}-${cat.slug}`,
          default: stateSlug === slug,
          // Inherit the set's fields so newly-synced variants aren't left null
          // (variants read rarity/style/label from the set at display time, but
          // storing them keeps the variant edit form and data consistent).
          ...variantSharedFields,
        }))
    )
    const expectedSlugs = new Set(expectedVariants.map((v) => v.slug))

    // Fetch all variants for base and all sibling slugs.
    const { data: currentVariants } = await supabase
      .from('outfit_variants')
      .select('slug, outfit_set, outfit_category')
      .in('outfit_set', stateSlugs)

    const currentSlugsInDB = new Set((currentVariants ?? []).map((v) => v.slug))

    const toInsert = expectedVariants.filter((v) => !currentSlugsInDB.has(v.slug))
    const toDelete = (currentVariants ?? [])
      .filter((v) => !expectedSlugs.has(v.slug))
      .map((v) => v.slug)

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('outfit_variants').insert(toInsert)
      if (insertError) return { error: insertError.message }
    }

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('outfit_variants')
        .delete()
        .in('slug', toDelete)
      if (deleteError) return { error: deleteError.message }
    }
  } else {
    // No categories selected — remove all variants for base and siblings.
    const { data: finalEvolutions } = await supabase
      .from('outfit_sets')
      .select('slug')
      .eq('base_set', slug)
    const stateSlugs = [slug, ...(finalEvolutions ?? []).map((e) => e.slug)]
    const { error: deleteAllError } = await supabase
      .from('outfit_variants')
      .delete()
      .in('outfit_set', stateSlugs)
    if (deleteAllError) return { error: deleteAllError.message }
  }

  // When handhelds are base-only, the evolution-state handheld variants were
  // dropped above (either by the diff or the delete-all path). obtained_outfit
  // has no FK to outfit_variants (only to outfit_sets/outfit_categories), so
  // deleting those variants leaves any obtained record keyed
  // (evolution slug, 'handhelds') orphaned. Clean them up regardless of which
  // variant-sync branch ran.
  if (handheldBaseOnly) {
    const { data: evolutionRows } = await supabase
      .from('outfit_sets')
      .select('slug')
      .eq('base_set', slug)
    const evolutionSlugs = (evolutionRows ?? []).map((e) => e.slug)
    if (evolutionSlugs.length > 0) {
      const { error: obtainedError } = await supabase
        .from('obtained_outfit')
        .delete()
        .in('outfit_set', evolutionSlugs)
        .eq('outfit_category', 'handhelds')
      if (obtainedError) return { error: obtainedError.message }
    }
  }

  // Resolve a submitted variant input key back to its current DB slug, carrying
  // the slug across a base set rename (variant_image_ / variant_title_ / etc.).
  const resolveVariantSlug = (submittedSlug: string) =>
    previousSlug !== slug && submittedSlug.startsWith(`${previousSlug}-`)
      ? submittedSlug.replace(`${previousSlug}-`, `${slug}-`)
      : submittedSlug

  // Update variant images from hidden inputs.
  const variantImageEntries = [...formData.entries()].filter(([key]) =>
    key.startsWith('variant_image_')
  )
  for (const [key, value] of variantImageEntries) {
    const variantSlug = resolveVariantSlug(key.replace('variant_image_', ''))
    const { error: imgError } = await supabase
      .from('outfit_variants')
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
      .from('outfit_variants')
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
      .from('outfit_variants')
      .update({ description: (value as string).trim() || null })
      .eq('slug', variantSlug)
    if (descError) return { error: descError.message }
  }

  if (formData.get('update_only') === 'true') {
    const { data: variants } = await supabase
      .from('outfit_variants')
      .select(
        'id, slug, outfit_set, outfit_category, image_url, alt_image_url, title, description, default, updated_at, outfit_categories ( id )'
      )
      .eq('outfit_set', slug)
      .order('id', { ascending: true })

    return { savedTitle: title, variants: variants ?? [] }
  }
  if (formData.get('update_next') === 'true') {
    const { data: next } = await supabase
      .from('outfit_sets')
      .select('slug')
      .is('base_set', null)
      .gt('title', title)
      .order('title', { ascending: true })
      .order('slug', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.outfits.sets.edit}/${next.slug}`)
    redirect(navLinksData.admin.outfits.sets.list)
  }
  redirect(backUrl)
}

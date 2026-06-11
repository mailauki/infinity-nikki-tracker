'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toSlug, toSlugVariant } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { getUserRole } from '@/hooks/user'
import { EvolutionDraft } from '@/lib/types/outfit'

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

  if (!rarity) return { error: 'Rarity is required.' }

  const { error } = await supabase
    .from('outfit_sets')
    .insert([{ title, slug, description, rarity, style, label, label_2, ability }])

  if (error) return { error: error.message }

  const rollback = async () => {
    await supabase.from('outfit_sets').delete().eq('slug', slug)
  }

  if (evolutionDrafts.length > 0) {
    const evolutionRows = evolutionDrafts.map((draft) => ({
      slug: `${slug}-${toSlug(draft.subtitle)}`,
      title,
      subtitle: draft.subtitle,
      order: draft.order,
      outfit_set: slug,
    }))
    const { error: evoError } = await supabase.from('evolutions').insert(evolutionRows)
    if (evoError) {
      await rollback()
      return { error: 'Failed to save evolutions. The set was not created — please try again.' }
    }

    if (outfitCategories.length > 0) {
      const nullEvoVariants = outfitCategories.map((cat) => ({
        outfit_set: slug,
        outfit_category: cat.slug,
        evolution: null,
        slug: `${slug}-${cat.slug}`,
        default: true,
      }))
      const evoVariants = evolutionRows.flatMap((evo) =>
        outfitCategories.map((cat) => ({
          outfit_set: slug,
          outfit_category: cat.slug,
          evolution: evo.slug,
          slug: toSlugVariant(slug, cat.slug, evo.slug),
          default: false,
        }))
      )
      const { error: variantError } = await supabase
        .from('outfit_variants')
        .insert([...nullEvoVariants, ...evoVariants])
      if (variantError) {
        await rollback()
        return { error: 'Failed to save variants. The set was not created — please try again.' }
      }

      if (glowupEvolutionOrder) {
        const glowupSlug = evolutionRows.find((e) => e.order === glowupEvolutionOrder)?.slug ?? null
        if (glowupSlug) {
          await supabase
            .from('outfit_sets')
            .update({ glowup_evolution: glowupSlug })
            .eq('slug', slug)
        }
      }
    }
  } else if (outfitCategories.length > 0) {
    // No evolutions (e.g. 2-star sets) — create null-evolution variants
    const variants = outfitCategories.map((cat) => ({
      outfit_set: slug,
      outfit_category: cat.slug,
      evolution: null,
      slug: `${slug}-${cat.slug}`,
      default: true,
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

  if (!rarity) return { error: 'Rarity is required.' }

  // Capture the previous slug so we can carry variant images across a slug rename
  const { data: existingSet } = await supabase
    .from('outfit_sets')
    .select('slug')
    .eq('id', id)
    .single()
  const previousSlug = existingSet?.slug ?? slug

  const { error } = await supabase
    .from('outfit_sets')
    .update({
      title,
      slug,
      description,
      rarity,
      style,
      label,
      label_2,
      ability,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  // The outfit_set FK cascades, but variant *slugs* are stored strings. Rename the
  // base (null-evolution) variants in place so the sync below treats them as existing
  // and preserves their image_url/alt_image_url instead of deleting + reinserting with
  // null images. Evolution variants embed the evolution slug too, so they are left for
  // the sync to rebuild (their images are managed by the evolution edit form).
  if (previousSlug !== slug) {
    const { data: renameVariants } = await supabase
      .from('outfit_variants')
      .select('slug, outfit_category')
      .eq('outfit_set', slug)
      .is('evolution', null)

    for (const v of renameVariants ?? []) {
      if (v.slug !== `${previousSlug}-${v.outfit_category}`) continue
      const { error: renameError } = await supabase
        .from('outfit_variants')
        .update({ slug: `${slug}-${v.outfit_category}` })
        .eq('slug', v.slug)
      if (renameError) return { error: renameError.message }
    }
  }

  // Load current DB evolutions for this set (using the new slug post-cascade)
  const { data: currentEvolutions } = await supabase
    .from('evolutions')
    .select('slug, order')
    .eq('outfit_set', slug)

  const currentSlugs = (currentEvolutions ?? []).map((e) => e.slug)
  const submittedExistingSlugs = evolutionDrafts
    .filter((d) => d.existingSlug)
    .map((d) => d.existingSlug as string)

  // Delete removed evolutions (cascade removes their variants; obtained SET NULL)
  const deletedSlugs = currentSlugs.filter((s) => !submittedExistingSlugs.includes(s))
  if (deletedSlugs.length > 0) {
    const { error: deleteError } = await supabase
      .from('evolutions')
      .delete()
      .in('slug', deletedSlugs)
    if (deleteError) return { error: deleteError.message }
  }

  // Update existing evolutions
  const updatedDrafts = evolutionDrafts.filter((d) => d.existingSlug)
  for (const draft of updatedDrafts) {
    const newEvoSlug = `${slug}-${toSlug(draft.subtitle)}`
    const { error: updateError } = await supabase
      .from('evolutions')
      .update({
        slug: newEvoSlug,
        title,
        subtitle: draft.subtitle,
        order: draft.order,
        outfit_set: slug,
      })
      .eq('slug', draft.existingSlug as string)
    if (updateError) return { error: updateError.message }
  }

  // Insert new evolutions
  const newDrafts = evolutionDrafts.filter((d) => !d.existingSlug)
  if (newDrafts.length > 0) {
    const newEvoRows = newDrafts.map((draft) => ({
      slug: `${slug}-${toSlug(draft.subtitle)}`,
      title,
      subtitle: draft.subtitle,
      order: draft.order,
      outfit_set: slug,
    }))
    const { error: evoError } = await supabase.from('evolutions').insert(newEvoRows)
    if (evoError) return { error: evoError.message }
  }

  // Sync variants: diff DB state against (evolutions × categories), including base (null evolution)
  if (outfitCategories.length > 0) {
    const { data: finalEvolutions } = await supabase
      .from('evolutions')
      .select('slug')
      .eq('outfit_set', slug)

    const evolutionSlugs: (string | null)[] = [null, ...(finalEvolutions ?? []).map((e) => e.slug)]

    // Build the complete expected set of variant slugs
    const expectedVariants = evolutionSlugs.flatMap((evo) =>
      outfitCategories.map((cat) => ({
        outfit_set: slug,
        outfit_category: cat.slug,
        evolution: evo,
        slug: evo ? toSlugVariant(slug, cat.slug, evo) : `${slug}-${cat.slug}`,
        default: evo === null,
      }))
    )
    const expectedSlugs = new Set(expectedVariants.map((v) => v.slug))

    // Fetch all current variants for this set
    const { data: currentVariants } = await supabase
      .from('outfit_variants')
      .select('slug, outfit_category, evolution')
      .eq('outfit_set', slug)

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
        .eq('outfit_set', slug)
        .in('slug', toDelete)
      if (deleteError) return { error: deleteError.message }
    }
  } else {
    // No categories selected — remove all variants
    const { error: deleteAllError } = await supabase
      .from('outfit_variants')
      .delete()
      .eq('outfit_set', slug)
    if (deleteAllError) return { error: deleteAllError.message }
  }

  // Update glowup_evolution on the set
  const glowupSlug = glowupEvolutionOrder
    ? `${slug}-${toSlug(evolutionDrafts.find((d) => d.order === glowupEvolutionOrder)?.subtitle ?? '')}` ||
      null
    : null
  const { error: glowupError } = await supabase
    .from('outfit_sets')
    .update({ glowup_evolution: glowupSlug })
    .eq('id', id)
  if (glowupError) return { error: glowupError.message }

  // Update variant images from hidden inputs. The inputs are keyed by the slug at page
  // load, so on a slug rename remap the old prefix to the new one to target the renamed row.
  const variantImageEntries = [...formData.entries()].filter(([key]) =>
    key.startsWith('variant_image_')
  )
  for (const [key, value] of variantImageEntries) {
    const submittedSlug = key.replace('variant_image_', '')
    const variantSlug =
      previousSlug !== slug && submittedSlug.startsWith(`${previousSlug}-`)
        ? submittedSlug.replace(`${previousSlug}-`, `${slug}-`)
        : submittedSlug
    const { error: imgError } = await supabase
      .from('outfit_variants')
      .update({ image_url: (value as string) || null })
      .eq('slug', variantSlug)
    if (imgError) return { error: imgError.message }
  }

  if (formData.get('update_only') === 'true') {
    const { data: variants } = await supabase
      .from('outfit_variants')
      .select(
        'id, slug, outfit_set, outfit_category, evolution, image_url, alt_image_url, default, updated_at'
      )
      .eq('outfit_set', slug)
      .is('evolution', null)
      .order('id', { ascending: true })

    return { savedTitle: title, variants: variants ?? [] }
  }
  redirect(backUrl)
}

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
        default: false,
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

  // Insert new evolutions and their variants
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

    if (outfitCategories.length > 0) {
      const newVariants = newEvoRows.flatMap((evo) =>
        outfitCategories.map((cat) => ({
          outfit_set: slug,
          outfit_category: cat.slug,
          evolution: evo.slug,
          slug: toSlugVariant(slug, cat.slug, evo.slug),
          default: false,
        }))
      )
      const { error: variantError } = await supabase.from('outfit_variants').insert(newVariants)
      if (variantError) return { error: variantError.message }
    }
  }

  // Sync categories: add variants for newly selected categories, delete for removed ones
  const { data: currentVariantCats } = await supabase
    .from('outfit_variants')
    .select('outfit_category')
    .eq('outfit_set', slug)
  const currentCategorySlugs = [
    ...new Set((currentVariantCats ?? []).map((v) => v.outfit_category).filter(Boolean)),
  ] as string[]
  const submittedCategorySlugs = outfitCategories.map((c) => c.slug)

  const removedCategories = currentCategorySlugs.filter((s) => !submittedCategorySlugs.includes(s))
  const addedCategories = submittedCategorySlugs.filter((s) => !currentCategorySlugs.includes(s))

  if (removedCategories.length > 0) {
    const { error: removeCatError } = await supabase
      .from('outfit_variants')
      .delete()
      .eq('outfit_set', slug)
      .in('outfit_category', removedCategories)
    if (removeCatError) return { error: removeCatError.message }
  }

  if (addedCategories.length > 0) {
    const { data: finalEvolutions } = await supabase
      .from('evolutions')
      .select('slug, order')
      .eq('outfit_set', slug)

    const nullEvoRows = addedCategories.map((catSlug) => ({
      outfit_set: slug,
      outfit_category: catSlug,
      evolution: null as string | null,
      slug: `${slug}-${catSlug}`,
      default: false,
    }))
    const newCatVariants =
      finalEvolutions && finalEvolutions.length > 0
        ? [
            ...nullEvoRows,
            ...finalEvolutions.flatMap((evo) =>
              addedCategories.map((catSlug) => ({
                outfit_set: slug,
                outfit_category: catSlug,
                evolution: evo.slug,
                slug: toSlugVariant(slug, catSlug, evo.slug),
                default: false,
              }))
            ),
          ]
        : nullEvoRows
    const { error: addCatError } = await supabase.from('outfit_variants').insert(newCatVariants)
    if (addCatError) return { error: addCatError.message }
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

  // Update variant images from hidden inputs
  const variantImageEntries = [...formData.entries()].filter(([key]) =>
    key.startsWith('variant_image_')
  )
  for (const [key, value] of variantImageEntries) {
    const variantSlug = key.replace('variant_image_', '')
    const { error: imgError } = await supabase
      .from('outfit_variants')
      .update({ image_url: (value as string) || null })
      .eq('slug', variantSlug)
    if (imgError) return { error: imgError.message }
  }

  redirect(backUrl)
}

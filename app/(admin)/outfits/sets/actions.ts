'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toSlugVariant } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'

export async function addOutfitSet(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const rarityRaw = formData.get('rarity') as string | null
  const rarity = rarityRaw ? parseInt(rarityRaw, 10) : null
  const style = (formData.get('style') as string | null) || null
  const label = (formData.get('label') as string | null) || null
  const ability = (formData.get('ability') as string | null) || null
  const evolutionSelect = JSON.parse(
    (formData.get('evolution_select') as string) || '[]'
  ) as string[]
  const defaultEvolution = (formData.get('default_evolution') as string | null) || ''
  const outfitCategories = JSON.parse(
    (formData.get('outfit_categories') as string) || '[]'
  ) as { slug: string }[]

  if (!rarity) return { error: 'Rarity is required.' }

  const { error } = await supabase
    .from('outfit_sets')
    .insert([{ title, slug, description, rarity, style, label, ability }])

  if (error) return { error: error.message }

  const rollback = async () => {
    await supabase.from('outfit_sets').delete().eq('slug', slug)
  }

  if (evolutionSelect.length > 0 && outfitCategories.length > 0) {
    const variants = evolutionSelect.flatMap((evolution) =>
      outfitCategories.map((cat) => ({
        outfit_set: slug,
        outfit_category: cat.slug,
        evolution,
        slug: toSlugVariant(slug, cat.slug, evolution),
        default: defaultEvolution ? evolution === defaultEvolution : false,
      }))
    )
    const { error: variantError } = await supabase.from('outfit_variants').insert(variants)
    if (variantError) {
      await rollback()
      return { error: 'Failed to save variants. The set was not created — please try again.' }
    }
  }

  redirect(navLinksData.dashboard.outfits.sets.add.replace('/new', ''))
}

export async function editOutfitSet(
  id: number,
  initialEvolutions: string[],
  backUrl: string,
  _: unknown,
  formData: FormData
) {
  const supabase = await createClient()

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const rarityRaw = formData.get('rarity') as string | null
  const rarity = rarityRaw ? parseInt(rarityRaw, 10) : null
  const style = (formData.get('style') as string | null) || null
  const label = (formData.get('label') as string | null) || null
  const ability = (formData.get('ability') as string | null) || null
  const evolutionSelect = JSON.parse(
    (formData.get('evolution_select') as string) || '[]'
  ) as string[]
  const defaultEvolution = (formData.get('default_evolution') as string | null) || ''
  const outfitCategories = JSON.parse(
    (formData.get('outfit_categories') as string) || '[]'
  ) as { slug: string }[]

  if (!rarity) return { error: 'Rarity is required.' }

  const { error } = await supabase
    .from('outfit_sets')
    .update({ title, slug, description, rarity, style, label, ability, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  const addedEvolutions = evolutionSelect.filter((e) => !initialEvolutions.includes(e))
  const removedEvolutions = initialEvolutions.filter((e) => !evolutionSelect.includes(e))

  if (addedEvolutions.length > 0) {
    const newVariants = addedEvolutions.flatMap((evolution) =>
      outfitCategories.map((cat) => ({
        outfit_set: slug,
        outfit_category: cat.slug,
        evolution,
        slug: toSlugVariant(slug, cat.slug, evolution),
        default: defaultEvolution ? evolution === defaultEvolution : false,
      }))
    )
    const { error: insertError } = await supabase.from('outfit_variants').insert(newVariants)
    if (insertError) return { error: insertError.message }
  }

  if (removedEvolutions.length > 0) {
    const { error: deleteError } = await supabase
      .from('outfit_variants')
      .delete()
      .eq('outfit_set', slug)
      .in('evolution', removedEvolutions)
    if (deleteError) return { error: deleteError.message }
  }

  // Sync default flag
  const { error: clearDefaultError } = await supabase
    .from('outfit_variants')
    .update({ default: false })
    .eq('outfit_set', slug)
  if (clearDefaultError) return { error: clearDefaultError.message }

  if (defaultEvolution) {
    const { error: setDefaultError } = await supabase
      .from('outfit_variants')
      .update({ default: true })
      .eq('outfit_set', slug)
      .eq('evolution', defaultEvolution)
    if (setDefaultError) return { error: setDefaultError.message }
  }

  // Update variant images passed as hidden inputs
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

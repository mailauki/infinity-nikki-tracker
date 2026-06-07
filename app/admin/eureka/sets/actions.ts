'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toSlugVariant } from '@/lib/utils'
import { navLinksData } from '@/lib/nav-links'
import { getUserRole } from '@/hooks/user'

export async function addEurekaSet(_: unknown, formData: FormData) {
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
  const selectedTrials = JSON.parse((formData.get('selected_trials') as string) || '[]') as string[]
  const colorSelect = JSON.parse((formData.get('color_select') as string) || '[]') as string[]
  const defaultColor = (formData.get('default_color') as string | null) || ''
  const categories = JSON.parse((formData.get('categories') as string) || '[]') as {
    slug: string
  }[]

  const { error } = await supabase
    .from('eureka_sets')
    .insert([{ title, slug, description, rarity, style, label }])

  if (error) return { error: error.message }

  const rollback = async () => {
    await supabase.from('eureka_sets').delete().eq('slug', slug)
  }

  if (selectedTrials.length > 0) {
    const { error: trialsError } = await supabase
      .from('eureka_set_trials')
      .insert(selectedTrials.map((t) => ({ eureka_set: slug, trial: t })))
    if (trialsError) {
      await rollback()
      return { error: 'Failed to save trials. The set was not created — please try again.' }
    }
  }

  if (colorSelect.length > 0) {
    const variants = colorSelect.flatMap((color) =>
      categories.map((cat) => ({
        eureka_set: slug,
        category: cat.slug,
        color,
        slug: toSlugVariant(slug, cat.slug, color),
        default: defaultColor ? color === defaultColor : false,
      }))
    )
    const { error: variantError } = await supabase.from('eureka_variants').insert(variants)
    if (variantError) {
      await rollback()
      return { error: 'Failed to save variants. The set was not created — please try again.' }
    }
  }

  if (formData.get('add_another') === 'true')
    return { addAnother: true as const, savedTitle: title }
  redirect(navLinksData.admin.eureka.sets.list)
}

export async function editEurekaSet(
  id: number,
  initialColors: string[],
  backUrl: string,
  _: unknown,
  formData: FormData
) {
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
  const selectedTrials = JSON.parse((formData.get('selected_trials') as string) || '[]') as string[]
  const colorSelect = JSON.parse((formData.get('color_select') as string) || '[]') as string[]
  const defaultColor = (formData.get('default_color') as string | null) || ''
  const categories = JSON.parse((formData.get('categories') as string) || '[]') as {
    slug: string
  }[]
  const originalTrials = JSON.parse((formData.get('original_trials') as string) || '[]') as string[]

  const { error } = await supabase
    .from('eureka_sets')
    .update({
      title,
      slug,
      description,
      rarity,
      style,
      label,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  // Replace junction rows for trials
  const { error: deleteTrialsError } = await supabase
    .from('eureka_set_trials')
    .delete()
    .eq('eureka_set', slug)
  if (deleteTrialsError) return { error: deleteTrialsError.message }

  if (selectedTrials.length > 0) {
    const { error: insertTrialsError } = await supabase
      .from('eureka_set_trials')
      .insert(selectedTrials.map((t) => ({ eureka_set: slug, trial: t })))
    if (insertTrialsError) {
      // Restore original trial associations
      if (originalTrials.length > 0) {
        await supabase
          .from('eureka_set_trials')
          .insert(originalTrials.map((t) => ({ eureka_set: slug, trial: t })))
      }
      return {
        error: 'Failed to update trials. Your previous trial associations have been restored.',
      }
    }
  }

  const addedColors = colorSelect.filter((c) => !initialColors.includes(c))
  const removedColors = initialColors.filter((c) => !colorSelect.includes(c))

  if (addedColors.length > 0) {
    const newVariants = addedColors.flatMap((color) =>
      categories.map((cat) => ({
        eureka_set: slug,
        category: cat.slug,
        color,
        slug: toSlugVariant(slug, cat.slug, color),
        default: defaultColor ? color === defaultColor : false,
      }))
    )
    const { error: insertError } = await supabase.from('eureka_variants').insert(newVariants)
    if (insertError) return { error: insertError.message }
  }

  if (removedColors.length > 0) {
    const { error: deleteError } = await supabase
      .from('eureka_variants')
      .delete()
      .eq('eureka_set', slug)
      .in('color', removedColors)
    if (deleteError) return { error: deleteError.message }
  }

  // Sync default flag
  const { error: clearDefaultError } = await supabase
    .from('eureka_variants')
    .update({ default: false })
    .eq('eureka_set', slug)
  if (clearDefaultError) return { error: clearDefaultError.message }

  if (defaultColor) {
    const { error: setDefaultError } = await supabase
      .from('eureka_variants')
      .update({ default: true })
      .eq('eureka_set', slug)
      .eq('color', defaultColor)
    if (setDefaultError) return { error: setDefaultError.message }
  }

  redirect(backUrl)
}

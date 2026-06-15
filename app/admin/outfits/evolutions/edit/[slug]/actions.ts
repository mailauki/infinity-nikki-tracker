'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toSlug } from '@/lib/utils'
import { getUserRole } from '@/hooks/user'

export async function editEvolution(
  currentSlug: string,
  outfitSet: string,
  backUrl: string,
  _: unknown,
  formData: FormData
) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const subtitle = (formData.get('subtitle') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const newSlug = `${outfitSet}-${toSlug(subtitle)}`

  const { error } = await supabase
    .from('evolutions')
    .update({ subtitle, description, slug: newSlug })
    .eq('slug', currentSlug)

  if (error) return { error: error.message }

  // Update variant images from hidden inputs (ON UPDATE CASCADE already updated variant slugs)
  const variantImageEntries = [...formData.entries()].filter(
    ([key]) => key.startsWith('variant_image_') && !key.startsWith('variant_alt_image_')
  )
  for (const [key, value] of variantImageEntries) {
    const variantSlug = key.replace('variant_image_', '')
    const { error: imgError } = await supabase
      .from('outfit_variants')
      .update({ image_url: (value as string) || null })
      .eq('slug', variantSlug)
    if (imgError) return { error: imgError.message }
  }

  const variantAltImageEntries = [...formData.entries()].filter(([key]) =>
    key.startsWith('variant_alt_image_')
  )
  for (const [key, value] of variantAltImageEntries) {
    const variantSlug = key.replace('variant_alt_image_', '')
    const { error: imgError } = await supabase
      .from('outfit_variants')
      .update({ alt_image_url: (value as string) || null })
      .eq('slug', variantSlug)
    if (imgError) return { error: imgError.message }
  }

  // Update variant titles from text inputs.
  const variantTitleEntries = [...formData.entries()].filter(([key]) =>
    key.startsWith('variant_title_')
  )
  for (const [key, value] of variantTitleEntries) {
    const variantSlug = key.replace('variant_title_', '')
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
    const variantSlug = key.replace('variant_description_', '')
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
        'id, slug, outfit_category, image_url, alt_image_url, title, description, default, updated_at'
      )
      .eq('evolution', newSlug)
      .order('id', { ascending: true })

    return { savedTitle: subtitle, slug: newSlug, variants: variants ?? [] }
  }
  redirect(backUrl)
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/hooks/user'
import { navLinksData } from '@/lib/nav-links'

export async function editEvolution(
  currentSlug: string,
  baseSet: string,
  backUrl: string,
  _: unknown,
  formData: FormData
) {
  const role = await getUserRole()
  if (role !== 'admin') return { error: 'Forbidden' }

  const supabase = await createClient()

  const description = (formData.get('description') as string | null)?.trim() || null

  const { error } = await supabase
    .from('outfit_sets')
    .update({ description })
    .eq('slug', currentSlug)

  if (error) return { error: error.message }

  // Update variant images from hidden inputs
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
      .eq('outfit_set', currentSlug)
      .order('id', { ascending: true })

    return { savedTitle: currentSlug, slug: currentSlug, variants: variants ?? [] }
  }

  if (formData.get('update_next') === 'true') {
    // Evolutions share a title across all stages of a set (title = set name), so
    // "next" walks by (base_set, order) to match the list view — order the full
    // list and take the row after the just-saved one. All rows here have
    // base_set IS NOT NULL since we filter to evolution rows only.
    const { data: ordered } = await supabase
      .from('outfit_sets')
      .select('slug, base_set, "order"')
      .not('base_set', 'is', null)
      .order('base_set', { ascending: true })
      .order('order', { ascending: true })

    const rows = ordered ?? []
    const currentIndex = rows.findIndex((e) => e.slug === currentSlug)
    const next = currentIndex >= 0 ? rows[currentIndex + 1] : undefined

    if (next?.slug) redirect(`${navLinksData.admin.outfits.evolutions.edit}/${next.slug}`)
    redirect(navLinksData.admin.outfits.evolutions.list)
  }

  redirect(backUrl)
}

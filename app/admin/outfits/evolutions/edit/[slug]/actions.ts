'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { toSlug } from '@/lib/utils'
import { getUserRole } from '@/hooks/user'
import { navLinksData } from '@/lib/nav-links'

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

  if (formData.get('update_next') === 'true') {
    // Evolutions share a title across all stages of a set (title = set name), so
    // order by id like the evolutions list/data hook — ordering by title would
    // skip every sibling stage. Re-read id by the post-save slug.
    const { data: saved } = await supabase
      .from('evolutions')
      .select('id')
      .eq('slug', newSlug)
      .maybeSingle()

    const { data: next } = await supabase
      .from('evolutions')
      .select('slug')
      .gt('id', saved?.id ?? 0)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (next?.slug) redirect(`${navLinksData.admin.outfits.evolutions.edit}/${next.slug}`)
    redirect(navLinksData.admin.outfits.evolutions.list)
  }

  redirect(backUrl)
}

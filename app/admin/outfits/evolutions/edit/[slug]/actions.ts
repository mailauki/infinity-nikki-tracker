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

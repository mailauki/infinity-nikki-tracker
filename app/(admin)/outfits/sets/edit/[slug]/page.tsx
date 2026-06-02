import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import EditOutfitSetForm from './edit-outfit-set-form'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getAbilities } from '@/hooks/data/abilities'
import { getEvolutions } from '@/hooks/data/evolutions'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Outfit Set',
}

export default async function EditOutfitSetPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditOutfitSet params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditOutfitSet({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const referer = (await headers()).get('referer') ?? ''
  const refererPath = new URL(referer, 'http://localhost').pathname
  const back = refererPath.startsWith('/outfits/') ? refererPath : '/dashboard/outfits/sets'

  const supabase = await createClient()

  const { data: outfitSet } = await supabase
    .from('outfit_sets')
    .select('id, slug, title, description, rarity, style, label, ability, updated_at')
    .eq('slug', slug)
    .single()

  if (!outfitSet || !outfitSet.slug) notFound()

  const [styles, labels, abilities, evolutions, outfitCategories] = await Promise.all([
    getStyles(),
    getLabels(),
    getAbilities(),
    getEvolutions(),
    getOutfitCategories(),
  ])

  const { data: variantRows, error: variantRowsError } = await supabase
    .from('outfit_variants')
    .select('id, outfit_set, evolution, outfit_category, slug, image_url, default, updated_at')
    .eq('outfit_set', outfitSet.slug)
  if (variantRowsError) throw variantRowsError

  const initialEvolutions = [
    ...new Set(variantRows.map((v) => v.evolution as string).filter(Boolean)),
  ]
  const initialDefaultEvolution = variantRows.find((v) => v.default)?.evolution ?? ''
  const initialVariants = variantRows

  return (
    <EditOutfitSetForm
      abilities={abilities}
      back={back}
      evolutions={evolutions}
      initialDefaultEvolution={initialDefaultEvolution}
      initialEvolutions={initialEvolutions}
      initialVariants={initialVariants}
      labels={labels}
      outfitCategories={outfitCategories}
      outfitSet={outfitSet}
      styles={styles}
    />
  )
}

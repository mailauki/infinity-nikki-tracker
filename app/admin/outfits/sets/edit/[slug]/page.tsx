import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EditOutfitSetForm from './edit-outfit-set-form'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getAbilities } from '@/hooks/data/abilities'
import { getEvolutionsBySet } from '@/hooks/data/evolutions'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { EvolutionDraft } from '@/lib/types/outfit'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Outfit Set',
}

export default async function EditOutfitSetPage({ params }: { params: Promise<{ slug: string }> }) {
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
  const back = '/admin/outfits/sets'

  const supabase = await createClient()

  const { data: outfitSet } = await supabase
    .from('outfit_sets')
    .select(
      'id, slug, title, description, rarity, style, label, label_2, ability, image_url, alt_image_url, glowup_evolution, updated_at'
    )
    .eq('slug', slug)
    .single()

  if (!outfitSet || !outfitSet.slug) notFound()

  const [styles, labels, abilities, evolutions, outfitCategories] = await Promise.all([
    getStyles(),
    getLabels(),
    getAbilities(),
    getEvolutionsBySet(outfitSet.slug),
    getOutfitCategories(),
  ])

  const { data: variantRows } = await supabase
    .from('outfit_variants')
    .select(
      'id, slug, outfit_set, outfit_category, evolution, image_url, alt_image_url, default, updated_at'
    )
    .eq('outfit_set', outfitSet.slug)
    .order('id', { ascending: true })

  const initialDrafts: EvolutionDraft[] = evolutions.map((e) => ({
    subtitle: e.subtitle ?? '',
    order: e.order,
    existingSlug: e.slug,
  }))

  const initialGlowupEvolutionOrder =
    evolutions.find((e) => e.slug === outfitSet.glowup_evolution)?.order ?? ''

  const derivedCategories = [
    ...new Set((variantRows ?? []).map((v) => v.outfit_category).filter(Boolean)),
  ] as string[]
  const initialCategorySelect =
    derivedCategories.length > 0 ? derivedCategories : outfitCategories.map((c) => c.slug)

  return (
    <EditOutfitSetForm
      abilities={abilities}
      back={back}
      initialCategorySelect={initialCategorySelect}
      initialDrafts={initialDrafts}
      initialGlowupEvolutionOrder={initialGlowupEvolutionOrder}
      initialVariants={variantRows ?? []}
      labels={labels}
      outfitCategories={outfitCategories}
      outfitSet={outfitSet}
      styles={styles}
    />
  )
}

import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EditOutfitSetForm from './edit-outfit-set-form'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getAbilities } from '@/hooks/data/abilities'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
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

  const supabase = await createClient()

  const { data: outfitSet } = await supabase
    .from('outfit_sets')
    .select(
      'id, slug, title, description, rarity, style, label, label_2, ability, seasons, season_category, image_url, alt_image_url, "order", base_set, handheld_base_only, updated_at'
    )
    .eq('slug', slug)
    .is('base_set', null)
    .single()

  if (!outfitSet || !outfitSet.slug) notFound()

  const [
    styles,
    labels,
    abilities,
    seasons,
    seasonCategories,
    evolutions,
    outfitCategories,
    carouselRows,
  ] = await Promise.all([
    getStyles(),
    getLabels(),
    getAbilities(),
    getSeasons(),
    getSeasonCategories(),
    getEvolutionsBySet(outfitSet.slug),
    getOutfitCategories(),
    supabase
      .from('outfit_set_carousel_images')
      .select('id, image_url, sort_order')
      .eq('outfit_set', outfitSet.slug)
      .order('sort_order', { ascending: true })
      .then((r) => r.data ?? []),
  ])

  const { data: variantRows } = await supabase
    .from('outfit_variants')
    .select(
      'id, slug, outfit_set, outfit_category, image_url, alt_image_url, title, description, default, updated_at, outfit_categories ( id )'
    )
    .eq('outfit_set', outfitSet.slug)
    .order('id', { ascending: true })

  // Build evolution drafts from sibling rows (base_set = slug).
  // The glow-up sibling has order = 0 in the DB (a marker, not a position), and
  // displays last. Sort siblings by their saved DB order (0 => last) so the form
  // shows them in the sequence the admin set, then reassign 1-based UI orders.
  const glowupEvo = evolutions.find((e) => e.order === 0)
  const orderKey = (o: number) => (o === 0 ? Infinity : o)
  const sortedEvos = [...evolutions].sort((a, b) => orderKey(a.order) - orderKey(b.order))
  const initialDrafts: EvolutionDraft[] = sortedEvos.map((e, i) => ({
    subtitle: e.title,
    order: i + 1,
    existingSlug: e.slug,
  }))

  // The glow-up is the sibling whose order === 0; find its 1-based UI position.
  const initialGlowupEvolutionOrder: number | '' = glowupEvo
    ? (initialDrafts.find((d) => d.existingSlug === glowupEvo.slug)?.order ?? '')
    : ''

  const initialCategorySelect = [
    ...new Set((variantRows ?? []).map((v) => v.outfit_category).filter(Boolean)),
  ] as string[]

  return (
    <EditOutfitSetForm
      abilities={abilities}
      initialCarouselImages={carouselRows}
      initialCategorySelect={initialCategorySelect}
      initialDrafts={initialDrafts}
      initialGlowupEvolutionOrder={initialGlowupEvolutionOrder}
      initialHandheldBaseOnly={outfitSet.handheld_base_only ?? false}
      initialVariants={variantRows ?? []}
      labels={labels}
      outfitCategories={outfitCategories}
      outfitSet={outfitSet}
      seasonCategories={seasonCategories}
      seasons={seasons}
      styles={styles}
    />
  )
}

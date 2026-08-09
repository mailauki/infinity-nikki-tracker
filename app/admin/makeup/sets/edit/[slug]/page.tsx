import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import EditMakeupSetForm from './edit-makeup-set-form'
import { getMakeupSetRaw, getMakeupSetsRaw } from '@/hooks/data/admin/makeup-sets'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getMakeupCategories } from '@/hooks/data/makeup-categories'
import { createClient } from '@/lib/supabase/server'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { parseEntityKey, parseGapKind } from '@/lib/admin-entities'

export const metadata: Metadata = {
  title: 'Edit Makeup Set',
}

type SearchParams = Promise<{ entity?: string; gap?: string; page?: string }>

export default function EditMakeupSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditMakeupSet params={params} searchParams={searchParams} />
      </Stack>
    </Suspense>
  )
}

async function EditMakeupSet({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  const { slug } = await params
  const { entity: rawEntity, gap: rawGap, page: rawPage } = await searchParams
  const entity = parseEntityKey(rawEntity)
  const gap = rawGap ? parseGapKind(rawGap) : null
  const page = Number.parseInt(rawPage ?? '1', 10)

  const [
    makeupSet,
    makeupSets,
    outfitSets,
    styles,
    labels,
    seasons,
    seasonCategories,
    makeupCategories,
  ] = await Promise.all([
    getMakeupSetRaw(slug),
    getMakeupSetsRaw(),
    getOutfitSetsRaw(),
    getStyles(),
    getLabels(),
    getSeasons(),
    getSeasonCategories(),
    getMakeupCategories(),
  ])

  if (!makeupSet) notFound()

  const supabase = await createClient()
  const { data: variantRows } = await supabase
    .from('makeup_variants')
    .select('id, slug, makeup_set, makeup_category, image_url, alt_image_url, title, description')
    .eq('makeup_set', makeupSet.slug)

  return (
    <EditMakeupSetForm
      entity={entity}
      gap={gap}
      initial={makeupSet}
      initialVariants={variantRows ?? []}
      labels={labels}
      makeupCategories={makeupCategories}
      makeupSets={makeupSets}
      outfitSets={outfitSets}
      page={Number.isFinite(page) && page > 0 ? page : 1}
      seasonCategories={seasonCategories}
      seasons={seasons}
      styles={styles}
    />
  )
}

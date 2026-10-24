import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getGlowupBaseOptions } from '@/hooks/data/admin/outfit-variants'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import EntityForm from '@/app/admin/entity-form'
import { addOutfitVariant } from '../actions'
import { pageTitle } from '@/lib/sitemap/routes'

export const metadata: Metadata = {
  title: pageTitle('/admin/outfits/variants/new'),
}

export default function NewOutfitVariantPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewOutfitVariant />
      </Stack>
    </Suspense>
  )
}

async function NewOutfitVariant() {
  const [outfitSets, outfitCategories, seasons, seasonCategories, styles, labels, glowupBases] =
    await Promise.all([
      getOutfitSetsRaw(),
      getOutfitCategories(),
      getSeasons(),
      getSeasonCategories(),
      getStyles(),
      getLabels(),
      getGlowupBaseOptions(),
    ])

  return (
    <EntityForm
      showAddAnother
      action={addOutfitVariant}
      formId="add-outfit-variant"
      formKind="outfitVariant"
      lookups={{
        outfitSets,
        outfitCategories,
        seasons,
        seasonCategories,
        styles,
        labels,
        glowupBases,
      }}
      mode="add"
    />
  )
}

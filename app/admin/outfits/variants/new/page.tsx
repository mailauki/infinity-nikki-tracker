import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { navLinksData } from '@/lib/nav-links'
import { getOutfitSetsRaw } from '@/hooks/data/admin/outfit-sets'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import EntityForm from '@/app/admin/entity-form'
import { addOutfitVariant } from '../actions'

export const metadata: Metadata = {
  title: 'Add Outfit Variant',
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
  const [outfitSets, outfitCategories, seasons, seasonCategories, styles, labels] =
    await Promise.all([
      getOutfitSetsRaw(),
      getOutfitCategories(),
      getSeasons(),
      getSeasonCategories(),
      getStyles(),
      getLabels(),
    ])

  return (
    <EntityForm
      showAddAnother
      action={addOutfitVariant}
      backUrl={navLinksData.admin.outfits.variants.list}
      formId="add-outfit-variant"
      formKind="outfitVariant"
      lookups={{ outfitSets, outfitCategories, seasons, seasonCategories, styles, labels }}
      mode="add"
    />
  )
}

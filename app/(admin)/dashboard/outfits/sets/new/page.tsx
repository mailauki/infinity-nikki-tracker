import { Suspense } from 'react'
import AddOutfitSetForm from './add-outfit-set-form'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getAbilities } from '@/hooks/data/abilities'
import { getOutfitCategories } from '@/hooks/data/outfit-categories'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Outfit Set',
}

export default function NewOutfitSetPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewOutfitSet />
      </Stack>
    </Suspense>
  )
}

async function NewOutfitSet() {
  const [styles, labels, abilities, outfitCategories] = await Promise.all([
    getStyles(),
    getLabels(),
    getAbilities(),
    getOutfitCategories(),
  ])

  return (
    <AddOutfitSetForm
      abilities={abilities}
      labels={labels}
      outfitCategories={outfitCategories}
      styles={styles}
    />
  )
}

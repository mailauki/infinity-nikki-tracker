import { Suspense } from 'react'
import AddOutfitSetForm from './add-outfit-set-form'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getAbilities } from '@/hooks/data/abilities'
import { getEvolutions } from '@/hooks/data/evolutions'
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
  const [styles, labels, abilities, evolutions, outfitCategories] = await Promise.all([
    getStyles(),
    getLabels(),
    getAbilities(),
    getEvolutions(),
    getOutfitCategories(),
  ])

  return (
    <AddOutfitSetForm
      abilities={abilities}
      evolutions={evolutions}
      labels={labels}
      outfitCategories={outfitCategories}
      styles={styles}
    />
  )
}

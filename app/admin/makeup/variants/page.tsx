import { getMakeupVariantsRaw } from '@/hooks/data/admin/makeup-variants'
import { getMakeupSetsRaw } from '@/hooks/data/admin/makeup-sets'
import { getMakeupCategories } from '@/hooks/data/makeup-categories'
import { getStyles } from '@/hooks/data/styles'
import { bySlug } from '@/lib/utils'
import { Suspense } from 'react'
import MakeupVariantView from './makeup-variant-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Makeup Variants',
}

export default function MakeupVariantsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [makeupVariants, makeupSets, makeupCategories, styles] = await Promise.all([
    getMakeupVariantsRaw(),
    getMakeupSetsRaw(),
    getMakeupCategories(),
    getStyles(),
  ])

  const sortedVariants = [...makeupVariants].sort(bySlug)

  return (
    <MakeupVariantView
      makeupCategories={makeupCategories}
      makeupSets={makeupSets}
      makeupVariants={sortedVariants}
      styles={styles}
    />
  )
}

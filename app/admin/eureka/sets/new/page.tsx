import { Suspense } from 'react'
import AddEurekaSetForm from './add-eureka-set-form'
import { getTrials } from '@/hooks/data/trials'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getEurekaColors } from '@/hooks/data/eureka-colors'
import { getEurekaCategories } from '@/hooks/data/eureka-categories'
import { getSeasons } from '@/hooks/data/seasons'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/admin/eureka/sets/new'),
}

export default function NewEurekaSetPage() {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <NewEurekaSet />
      </Stack>
    </Suspense>
  )
}

async function NewEurekaSet() {
  const [trials, styles, labels, colors, categories, seasons] = await Promise.all([
    getTrials(),
    getStyles(),
    getLabels(),
    getEurekaColors(),
    getEurekaCategories(),
    getSeasons(),
  ])

  return (
    <AddEurekaSetForm
      categories={categories ?? []}
      colors={colors ?? []}
      inherited={null}
      labels={labels ?? []}
      seasons={seasons}
      styles={styles ?? []}
      trials={trials ?? []}
    />
  )
}

import { Suspense } from 'react'
import AddEurekaSetForm from './add-eureka-set-form'
import { getTrials } from '@/hooks/data/trials'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getEurekaColors } from '@/hooks/data/eureka-colors'
import { getEurekaCategories } from '@/hooks/data/eureka-categories'
import { Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Eureka Set',
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
  const [trials, styles, labels, colors, categories] = await Promise.all([
    getTrials(),
    getStyles(),
    getLabels(),
    getEurekaColors(),
    getEurekaCategories(),
  ])

  return (
    <AddEurekaSetForm
      categories={categories ?? []}
      colors={colors ?? []}
      labels={labels ?? []}
      styles={styles ?? []}
      trials={trials ?? []}
    />
  )
}

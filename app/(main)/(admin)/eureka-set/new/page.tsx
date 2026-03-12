import { Suspense } from 'react'
import AddEurekaSetForm from '@/components/forms/eureka-set/add-eureka-set-form'
import { getTrials } from '@/hooks/data/trials'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getColors } from '@/hooks/data/colors'
import { getCategories } from '@/hooks/data/categories'
import { Container, Stack } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Eureka Set',
}

export default function NewEurekaSetPage() {
  return (
    <Suspense>
      <Container maxWidth="sm" sx={{ flexGrow: 1, py: 3 }}>
        <Stack spacing={3}>
          <NewEurekaSet />
        </Stack>
      </Container>
    </Suspense>
  )
}

async function NewEurekaSet() {
  const [trials, styles, labels, colors, categories] = await Promise.all([
    getTrials(),
    getStyles(),
    getLabels(),
    getColors(),
    getCategories(),
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

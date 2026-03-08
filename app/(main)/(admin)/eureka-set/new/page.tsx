import { Suspense } from 'react'
import { Box, Typography } from '@mui/material'
import AddEurekaSetForm from '@/components/forms/eureka-set/add-eureka-set-form'
import { getTrials } from '@/hooks/data/trials'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getColors } from '@/hooks/data/colors'
import { getCategories } from '@/hooks/data/categories'
import { Metadata } from 'next'
import PageContainer from '@/components/page-container'

export const metadata: Metadata = {
  title: 'Add Eureka Set',
}

export default function NewEurekaSetPage() {
  return (
    <Suspense>
      <PageContainer title="Add Eureka Set" size="sm">
        <NewEurekaSet />
      </PageContainer>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" component="h1">
        Add Eureka Set
      </Typography>
      <AddEurekaSetForm
        trials={trials ?? []}
        styles={styles ?? []}
        labels={labels ?? []}
        colors={colors ?? []}
        categories={categories ?? []}
      />
    </Box>
  )
}

import { Suspense } from 'react'
import { Box, Container, Typography } from '@mui/material'
import AddEurekaSetForm from '@/components/forms/eureka-set/add-eureka-set-form'
import { getTrials } from '@/hooks/data/trials'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getColors } from '@/hooks/data/colors'

export default function NewEurekaSetPage() {
  return (
    <Suspense>
      <Container maxWidth="sm" sx={{ flexGrow: 1, py: 3 }}>
        <NewEurekaSet />
      </Container>
    </Suspense>
  )
}

async function NewEurekaSet() {
  const [trials, styles, labels, colors] = await Promise.all([getTrials(), getStyles(), getLabels(), getColors()])

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
      />
    </Box>
  )
}

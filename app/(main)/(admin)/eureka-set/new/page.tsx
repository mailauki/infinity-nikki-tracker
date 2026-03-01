import { Suspense } from 'react'
import { Box, Container, Typography } from '@mui/material'
import { getTrials } from '@/lib/data'
import AddEurekaSetForm from '@/components/forms/eureka-set/add-eureka-set-form'

export default function NewEurekaSetPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <NewEurekaSet />
      </Container>
    </Suspense>
  )
}

async function NewEurekaSet() {
  const trials = await getTrials()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" component="h1">
        Add Eureka Set
      </Typography>
      <AddEurekaSetForm trials={trials ?? []} />
    </Box>
  )
}

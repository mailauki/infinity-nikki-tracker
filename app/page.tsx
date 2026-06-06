import { Box, Container, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'

import { QuickAccess } from '@/components/quick-access'
import { Hero } from '../components/hero'
import { HeroCTAs } from '@/components/hero-ctas'
import { getUserID } from '@/hooks/user'
import HelpActions from './help/help-actions'

export default function HomePage() {
  return (
    <Stack>
      <Hero />
      <Suspense>
        <HomeCTAs />
      </Suspense>
      <QuickAccess />
      <Box sx={{ py: 3 }}>
        <Typography sx={{ display: 'block', textAlign: 'center', mb: 2 }} variant="overline">
          Helpful Links
        </Typography>
        <Container maxWidth="sm">
          <HelpActions />
        </Container>
      </Box>
    </Stack>
  )
}

async function HomeCTAs() {
  const user_id = await getUserID()
  const isLoggedIn = !!user_id
  return <HeroCTAs isLoggedIn={isLoggedIn} />
}

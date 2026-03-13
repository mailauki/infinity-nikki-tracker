import { Suspense } from 'react'
import { Metadata } from 'next'
import { Container, Stack } from '@mui/material'

import TrialsContent from '@/components/eureka/trials-content'

export const metadata: Metadata = {
  title: 'Trials',
}

export default function TrialsPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <Stack spacing={3}>
          <TrialsContent />
        </Stack>
      </Container>
    </Suspense>
  )
}

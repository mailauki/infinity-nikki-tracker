import { Stack } from '@mui/material'
import { Suspense } from 'react'

import { QuickAccess } from '@/components/quick-access'
import { Hero } from './hero'

export default function HomePage() {
  return (
    <Stack>
      <Suspense>
        <Hero />
      </Suspense>
      <QuickAccess />
    </Stack>
  )
}

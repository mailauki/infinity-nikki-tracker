import { Stack } from '@mui/material'

import { QuickAccess } from '@/components/quick-access'
import { Hero } from './hero'

export default function HomePage() {
  return (
    <Stack>
      <Hero />
      <QuickAccess />
    </Stack>
  )
}

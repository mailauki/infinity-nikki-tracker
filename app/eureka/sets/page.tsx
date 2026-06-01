import { Suspense } from 'react'
import { Metadata } from 'next'
import { Stack } from '@mui/material'

import SetsContent from '@/components/eureka/sets-content'
import TrialsToolBar from '@/app/eureka/trials/trials-tool-bar'

export const metadata: Metadata = {
  title: 'Eureka Sets',
}

export default function EurekaSetsPage() {
  return (
    <>
      <TrialsToolBar />
      <Suspense>
        <Stack spacing={3} sx={{ flexGrow: 1, pb: 3 }}>
          <SetsContent />
        </Stack>
      </Suspense>
    </>
  )
}

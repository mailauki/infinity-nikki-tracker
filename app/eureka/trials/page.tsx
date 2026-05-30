import { Suspense } from 'react'
import { Metadata } from 'next'
import { Stack } from '@mui/material'

import TrialsContent from './trials-content'
import TrialsToolBar from './trials-tool-bar'

export const metadata: Metadata = {
  title: 'Trials',
}

export default function TrialsPage() {
  return (
    <>
      <TrialsToolBar />
      <Suspense>
        <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
          <TrialsContent />
        </Stack>
      </Suspense>
    </>
  )
}

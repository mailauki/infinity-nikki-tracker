import { Suspense } from 'react'
import { Container } from '@mui/material'
import { getTrialsAdmin } from '@/lib/data'
import { TrialTable } from '@/components/admin/trial-table'

export default function TrialPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <TrialLoader />
      </Container>
    </Suspense>
  )
}

async function TrialLoader() {
  const trials = await getTrialsAdmin()
  return <TrialTable rows={trials ?? []} />
}

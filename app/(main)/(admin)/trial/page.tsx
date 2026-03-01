import { Suspense } from 'react'
import { Container } from '@mui/material'
import { getTrialsAdmin } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import { toSlug } from '@/lib/utils'
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

  const nullSlugTrials = trials?.filter((t) => !t.slug) ?? []
  if (nullSlugTrials.length > 0) {
    const supabase = await createClient()
    await Promise.all(
      nullSlugTrials.map((trial) =>
        supabase.from('trials').update({ slug: toSlug(trial.name) }).eq('id', trial.id)
      )
    )
  }

  return <TrialTable rows={trials ?? []} />
}

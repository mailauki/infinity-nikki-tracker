import { Suspense } from 'react'
import { Container } from '@mui/material'
import { createClient } from '@/lib/supabase/server'
import { toSlug } from '@/lib/utils'
import { TrialTable } from '@/components/admin/trial-table'
import { getAdminData } from '@/hooks/data'

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
  const { trials } = await getAdminData()

  const nullSlugTrials = trials?.filter((t) => !t.slug) ?? []
  if (nullSlugTrials.length > 0) {
    const supabase = await createClient()
    await Promise.all(
      nullSlugTrials.map((trial) =>
        supabase
          .from('trials')
          .update({ slug: toSlug(trial.title) })
          .eq('id', trial.id)
      )
    )
  }

  return <TrialTable rows={trials ?? []} />
}

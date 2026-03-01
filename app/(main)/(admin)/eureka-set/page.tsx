import { Suspense } from 'react'
import { Container } from '@mui/material'
import { getEurekaSets } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import { toSlug } from '@/lib/utils'
import { EurekaSetTable } from '@/components/admin/eureka-set-table'

export default function EurekaSetPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <EurekaSetLoader />
      </Container>
    </Suspense>
  )
}

async function EurekaSetLoader() {
  const eurekaSets = await getEurekaSets()

  const nullSlugSets = eurekaSets?.filter((s) => !s.slug) ?? []
  if (nullSlugSets.length > 0) {
    const supabase = await createClient()
    await Promise.all(
      nullSlugSets.map((set) =>
        supabase.from('eureka_sets').update({ slug: toSlug(set.name) }).eq('id', set.id)
      )
    )
  }

  return <EurekaSetTable rows={eurekaSets ?? []} />
}

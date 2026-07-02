import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getTrialRaw } from '@/hooks/data/admin/trials'
import { getLocations } from '@/hooks/data/locations'
import { toSlug } from '@/lib/utils'
import EntityForm from '@/app/admin/entity-form'
import { editTrial } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit Trial',
}

export default async function EditTrialPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditTrial params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditTrial({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [trial, locations] = await Promise.all([getTrialRaw(slug), getLocations()])
  if (!trial) notFound()

  const back = '/admin/eureka/trials'

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editTrial.bind(null, trial.id, back)}
      backUrl={back}
      formId="edit-trial"
      formKind="trial"
      initialValues={{
        title: trial.title,
        slug: trial.slug ?? toSlug(trial.title),
        realm: trial.realm ?? '',
        description: trial.description ?? '',
        location: trial.location ?? '',
        image_url: trial.image_url,
      }}
      lookups={{ locations }}
      mode="edit"
    />
  )
}

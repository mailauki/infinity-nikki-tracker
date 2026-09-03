import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getLocationRaw } from '@/hooks/data/admin/locations'
import EntityForm from '@/app/admin/entity-form'
import { editLocation } from './actions'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/admin/locations/edit/[slug]'),
}

export default async function EditLocationPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditLocation params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditLocation({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const location = await getLocationRaw(slug)

  if (!location) notFound()

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editLocation.bind(null, location.slug)}
      formId="edit-location"
      formKind="location"
      initialValues={{
        title: location.title,
        slug: location.slug,
      }}
      mode="edit"
    />
  )
}

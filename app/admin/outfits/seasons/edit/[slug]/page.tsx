import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getSeasonRaw } from '@/hooks/data/admin/seasons'
import { getLocations } from '@/hooks/data/locations'
import EntityForm from '@/app/admin/entity-form'
import { editSeason } from './actions'

export const metadata: Metadata = {
  title: 'Edit Season',
}

export default async function EditSeasonPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditSeason params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditSeason({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [season, locations] = await Promise.all([getSeasonRaw(slug), getLocations()])

  if (!season) notFound()

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editSeason.bind(null, season.slug)}
      formId="edit-season"
      formKind="season"
      initialValues={{
        title: season.title,
        slug: season.slug,
        location: season.location ?? '',
        description: season.description ?? '',
        image_url: season.image_url,
        alt_image_url: season.alt_image_url,
      }}
      lookups={{ locations }}
      mode="edit"
    />
  )
}

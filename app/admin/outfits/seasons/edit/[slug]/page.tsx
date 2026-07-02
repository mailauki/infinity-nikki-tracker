import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { navLinksData } from '@/lib/nav-links'
import { getSeasonRaw } from '@/hooks/data/admin/seasons'
import { getLocations } from '@/hooks/data/locations'
import EntityForm from '@/app/admin/entity-form'
import { editSeason } from './actions'

export const metadata: Metadata = {
  title: 'Edit Season',
}

export default async function EditSeasonPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditSeason params={params} searchParams={searchParams} />
      </Stack>
    </Suspense>
  )
}

async function EditSeason({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  const { slug } = await params
  const { back: backParam } = await searchParams
  const back = backParam?.startsWith('/admin/')
    ? backParam
    : navLinksData.admin.outfits.seasons.list

  const [season, locations] = await Promise.all([getSeasonRaw(slug), getLocations()])

  if (!season) notFound()

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editSeason.bind(null, season.slug, back)}
      backUrl={back}
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

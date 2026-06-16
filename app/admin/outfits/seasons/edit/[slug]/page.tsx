import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { navLinksData } from '@/lib/nav-links'
import { getSeasonRaw } from '@/hooks/data/admin/seasons'
import { getLocations } from '@/hooks/data/locations'
import EditSeasonForm from './edit-season-form'

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

  return <EditSeasonForm back={back} locations={locations} season={season} />
}

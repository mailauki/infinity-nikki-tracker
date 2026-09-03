import { getLocationsRaw } from '@/hooks/data/admin/locations'
import { byTitleThenSlug } from '@/lib/utils'
import { Suspense } from 'react'
import LocationView from './location-view'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/admin/locations') }

export default function LocationsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const locations = await getLocationsRaw()
  const sorted = [...locations].sort(byTitleThenSlug)

  return <LocationView locations={sorted} />
}

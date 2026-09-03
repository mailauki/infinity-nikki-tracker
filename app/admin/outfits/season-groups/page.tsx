import { getSeasonGroupsRaw } from '@/hooks/data/admin/season-groups'
import { byTitleThenSlug } from '@/lib/utils'
import { Suspense } from 'react'
import OutfitSeasonGroupView from './outfit-season-group-view'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/admin/outfits/season-groups') }

export default function OutfitSeasonGroupsAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const groups = await getSeasonGroupsRaw()
  const sorted = [...groups].sort(byTitleThenSlug)

  return <OutfitSeasonGroupView groups={sorted} />
}

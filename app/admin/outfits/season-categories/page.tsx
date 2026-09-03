import { getSeasonCategoriesRaw } from '@/hooks/data/admin/season-categories'
import { getSeasonGroupsRaw } from '@/hooks/data/admin/season-groups'
import { byTitleThenSlug } from '@/lib/utils'
import { Suspense } from 'react'
import OutfitSeasonCategoryView from './outfit-season-category-view'
import { pageTitle } from '@/lib/page-titles'

export const metadata = { title: pageTitle('/admin/outfits/season-categories') }

export default function OutfitSeasonCategoriesAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  const [categories, seasonGroups] = await Promise.all([
    getSeasonCategoriesRaw(),
    getSeasonGroupsRaw(),
  ])
  const sorted = [...categories].sort(byTitleThenSlug)

  return <OutfitSeasonCategoryView categories={sorted} seasonGroups={seasonGroups} />
}

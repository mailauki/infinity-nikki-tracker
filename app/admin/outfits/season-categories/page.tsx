import { getSeasonCategoriesRaw } from '@/hooks/data/admin/season-categories'
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
  const categories = await getSeasonCategoriesRaw()
  const sorted = [...categories].sort(byTitleThenSlug)

  return <OutfitSeasonCategoryView categories={sorted} />
}

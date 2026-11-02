import { Suspense } from 'react'
import { getAllPageSections } from '@/hooks/data/admin/page-sections'
import { pageTitle } from '@/lib/sitemap/routes'
import ContentList from './content-list'

export const metadata = { title: pageTitle('/admin/content') }

export default function ContentAdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  )
}

async function AdminView() {
  return <ContentList rows={await getAllPageSections()} />
}

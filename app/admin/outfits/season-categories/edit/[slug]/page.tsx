import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { navLinksData } from '@/lib/nav-links'
import { getSeasonCategoryRaw } from '@/hooks/data/admin/season-categories'
import EditSeasonCategoryForm from './edit-season-category-form'

export const metadata: Metadata = {
  title: 'Edit Season Category',
}

export default async function EditSeasonCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ back?: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditSeasonCategory params={params} searchParams={searchParams} />
      </Stack>
    </Suspense>
  )
}

async function EditSeasonCategory({
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
    : navLinksData.admin.outfits.seasonCategories.list

  const category = await getSeasonCategoryRaw(slug)

  if (!category) notFound()

  return <EditSeasonCategoryForm back={back} category={category} />
}

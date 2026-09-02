import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getSeasonCategoryRaw } from '@/hooks/data/admin/season-categories'
import { getSeasonGroupsRaw } from '@/hooks/data/admin/season-groups'
import EntityForm from '@/app/admin/entity-form'
import { editSeasonCategory } from './actions'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/admin/outfits/season-categories/edit/[slug]'),
}

export default async function EditSeasonCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditSeasonCategory params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditSeasonCategory({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [category, seasonGroups] = await Promise.all([
    getSeasonCategoryRaw(slug),
    getSeasonGroupsRaw(),
  ])

  if (!category) notFound()

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editSeasonCategory.bind(null, category.slug)}
      formId="edit-season-category"
      formKind="seasonCategory"
      initialValues={{
        title: category.title,
        slug: category.slug,
        description: category.description ?? '',
        image_url: category.image_url,
        season_group: category.season_group ?? '',
      }}
      lookups={{ seasonGroups }}
      mode="edit"
    />
  )
}

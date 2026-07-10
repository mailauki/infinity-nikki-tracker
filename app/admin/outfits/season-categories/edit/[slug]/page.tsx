import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getSeasonCategoryRaw } from '@/hooks/data/admin/season-categories'
import EntityForm from '@/app/admin/entity-form'
import { editSeasonCategory } from './actions'

export const metadata: Metadata = {
  title: 'Edit Season Category',
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

  const category = await getSeasonCategoryRaw(slug)

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
      }}
      mode="edit"
    />
  )
}

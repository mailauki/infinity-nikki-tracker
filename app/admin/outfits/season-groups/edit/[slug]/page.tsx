import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getSeasonGroupRaw } from '@/hooks/data/admin/season-groups'
import EntityForm from '@/app/admin/entity-form'
import { editSeasonGroup } from './actions'
import { pageTitle } from '@/lib/page-titles'

export const metadata: Metadata = {
  title: pageTitle('/admin/outfits/season-groups/edit/[slug]'),
}

export default async function EditSeasonGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditSeasonGroup params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditSeasonGroup({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const group = await getSeasonGroupRaw(slug)

  if (!group) notFound()

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editSeasonGroup.bind(null, group.slug)}
      formId="edit-season-group"
      formKind="seasonGroup"
      initialValues={{
        title: group.title,
        slug: group.slug,
        description: group.description ?? '',
        image_url: group.image_url,
      }}
      mode="edit"
    />
  )
}

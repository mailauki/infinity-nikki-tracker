import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getPageSectionById } from '@/hooks/data/admin/page-sections'
import EntityForm from '@/app/admin/entity-form'
import { editPageSection } from './actions'
import { pageTitle } from '@/lib/sitemap/routes'

export const metadata: Metadata = {
  title: pageTitle('/admin/content/edit/[slug]'),
}

// `[slug]` is the section's id: slugs are only unique per page.
export default async function EditPageSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditPageSection params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditPageSection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: id } = await params

  const section = await getPageSectionById(id)

  if (!section) notFound()

  return (
    <EntityForm
      showUpdateOnly
      action={editPageSection.bind(null, section.id)}
      formId="edit-page-section"
      formKind="pageSection"
      initialValues={{ title: section.title, body: section.body, layout: section.layout }}
      maxWidth="md"
      mode="edit"
    />
  )
}
